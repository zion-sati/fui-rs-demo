mod services;

use fui::prelude::*;
use fui_rs_demo_shared::app_services::DemoServices;
#[cfg(feature = "native")]
use fui_rs_demo_shared::design_system::{
    demo_text, horizontal_spacer, DemoTextStyle,
};
#[cfg(feature = "native")]
use std::cell::Cell;
#[cfg(feature = "native")]
use std::rc::Rc;

#[derive(Clone, Copy)]
enum DemoPageId {
    Home,
    TextFonts,
    Advanced,
    ImmediateDrawing,
}

impl DemoPageId {
    #[cfg(feature = "native")]
    const ALL: [Self; 4] = [
        Self::Home,
        Self::TextFonts,
        Self::Advanced,
        Self::ImmediateDrawing,
    ];

    #[cfg(feature = "native")]
    fn from_index(index: i32) -> Option<Self> {
        usize::try_from(index)
            .ok()
            .and_then(|index| Self::ALL.get(index).copied())
    }

    #[cfg(feature = "native")]
    fn label(self) -> &'static str {
        match self {
            Self::Home => "Home",
            Self::TextFonts => "Text & Fonts",
            Self::Advanced => "Advanced",
            Self::ImmediateDrawing => "Immediate Drawing",
        }
    }

    fn caption(self) -> &'static str {
        match self {
            Self::Home => "FUI-RS Demo - Home",
            Self::TextFonts => "FUI-RS Demo - Text & Fonts",
            Self::Advanced => "FUI-RS Demo - Advanced",
            Self::ImmediateDrawing => "FUI-RS Demo - Immediate Drawing",
        }
    }

    #[cfg(feature = "native")]
    fn header(self) -> &'static str {
        match self {
            Self::Home => "Home Page - FUI-RS Demo ✌🏼",
            Self::TextFonts => "Text & Fonts - FUI-RS Demo 🫶",
            Self::Advanced => "Advanced - FUI-RS Demo",
            Self::ImmediateDrawing => "Immediate Drawing - FUI-RS Demo",
        }
    }

    fn create(self, services: &DemoServices) -> DemoPage {
        match self {
            Self::Home => DemoPage::Home(fui_rs_demo_home::HomePage::new(services.clock.clone())),
            Self::TextFonts => {
                DemoPage::TextFonts(fui_rs_demo_text_fonts::TextFontsPage::new())
            }
            Self::Advanced => DemoPage::Advanced(fui_rs_demo_advanced::AdvancedPage::new()),
            Self::ImmediateDrawing => DemoPage::ImmediateDrawing(
                fui_rs_demo_immediate_drawing::ImmediateDrawingPage::new(),
            ),
        }
    }
}

#[derive(Clone)]
enum DemoPage {
    Home(fui_rs_demo_home::HomePage),
    TextFonts(fui_rs_demo_text_fonts::TextFontsPage),
    Advanced(fui_rs_demo_advanced::AdvancedPage),
    ImmediateDrawing(fui_rs_demo_immediate_drawing::ImmediateDrawingPage),
}

impl DemoPage {
    #[cfg(feature = "native")]
    fn retained_root(&self) -> RetainedView {
        match self {
            Self::Home(page) => retained_view(page),
            Self::TextFonts(page) => retained_view(page),
            Self::Advanced(page) => retained_view(page),
            Self::ImmediateDrawing(page) => retained_view(page),
        }
    }
}

#[cfg(feature = "native")]
#[derive(Clone)]
pub struct NativeApp {
    root: FlexBox,
    _services: DemoServices,
    _tabs: TabView,
    _header_title: TextNode,
    _selector_buttons: Rc<Vec<Button>>,
    _selected_index: Rc<Cell<i32>>,
    #[cfg(feature = "native")]
    _worker_host_services: Rc<fui::worker_host_services::NativeWorkerHostServiceRegistration>,
}

#[cfg(feature = "native")]
fui_component!(NativeApp => root);

#[cfg(feature = "native")]
fn apply_selector_style(button: &Button, active: bool, theme: &Theme) {
    let background = if active {
        theme.colors.accent
    } else {
        theme.colors.surface
    };
    button.colors(
        ButtonColors::new()
            .background(background)
            .background_hover(if active {
                theme.colors.accent_hovered
            } else {
                fui::color::mix_color(background, theme.colors.accent, 0.18)
            })
            .background_pressed(if active {
                theme.colors.accent_pressed
            } else {
                fui::color::mix_color(background, theme.colors.accent, 0.30)
            })
            .text_primary(if active {
                theme.colors.text_on_accent
            } else {
                theme.colors.text_muted
            })
            .border(if active {
                theme.colors.accent
            } else {
                theme.colors.border
            }),
    );
}

#[cfg(feature = "native")]
fn selector(tabs: &TabView) -> (FlexBox, TextNode, Rc<Vec<Button>>, Rc<Cell<i32>>) {
    let selected_index = Rc::new(Cell::new(0));
    let mut buttons = Vec::with_capacity(DemoPageId::ALL.len());
    for (index, page_id) in DemoPageId::ALL.iter().copied().enumerate() {
        let button = button(page_id.label());
        button
            .corner_radius(999.0)
            .padding(16.0, 8.0, 16.0, 8.0)
            .on_click({
                let tabs = tabs.clone();
                move |_| {
                    tabs.select_index(index as i32);
                }
            })
            .bind_theme({
                let selected_index = selected_index.clone();
                move |button, theme| {
                    apply_selector_style(button, selected_index.get() == index as i32, &theme);
                }
            });
        buttons.push(button);
    }
    let buttons = Rc::new(buttons);
    let title = demo_text(DemoPageId::Home.header(), DemoTextStyle::Heading1);
    title
        .text_vertical_align(TextVerticalAlign::Center)
        .width(50.0, Unit::Percent);
    let controls = row()
        .justify_content(JustifyContent::End)
        .fill_width_percent(50.0)
        .flex_wrap(FlexWrap::Wrap)
        .clone();
    for (index, button) in buttons.iter().enumerate() {
        if index > 0 {
            controls.child(&horizontal_spacer(10.0));
        }
        controls.child(button);
    }
    let root = ui! {
        row()
            .fill_width()
            .flex_wrap(FlexWrap::Wrap)
            .padding(24.0, 24.0, 24.0, 16.0) {
                title,
                controls,
            }
    };
    (root, title, buttons, selected_index)
}

#[cfg(feature = "native")]
impl NativeApp {
    pub fn new() -> Self {
        use_system_theme();
        Application::caption(DemoPageId::Home.caption());
        let services = services::native::create_app_services();

        #[cfg(feature = "native")]
        let worker_host_services = Rc::new(
            fui_rs_demo_worker::register_native_worker_host_services()
                .expect("register native demo worker host services"),
        );

        let tabs = tab_view();
        tabs.fill_size().semantic_label("FUI-RS universal demo pages");
        for page_id in DemoPageId::ALL {
            let services = services.clone();
            tabs.add_item(TabItem::with_content(page_id.label(), move || {
                page_id.create(&services).retained_root()
            }));
        }

        let (selector, header_title, selector_buttons, selected_index) = selector(&tabs);
        tabs.on_selection_changed({
            let buttons = selector_buttons.clone();
            let header_title = header_title.clone();
            let selected_index = selected_index.clone();
            move |event| {
                selected_index.set(event.selected_index);
                let theme = current_theme();
                for (index, button) in buttons.iter().enumerate() {
                    apply_selector_style(button, index as i32 == event.selected_index, &theme);
                }
                if let Some(page_id) = DemoPageId::from_index(event.selected_index) {
                    Application::caption(page_id.caption());
                    header_title.text(page_id.header());
                }
            }
        });

        let root = ui! {
            column().fill_size().bind_theme(|root, theme| {
                root.bg_color(theme.colors.background);
            }) {
                selector,
                tabs,
            }
        };
        Self {
            root,
            _services: services,
            _tabs: tabs,
            _header_title: header_title,
            _selector_buttons: selector_buttons,
            _selected_index: selected_index,
            #[cfg(feature = "native")]
            _worker_host_services: worker_host_services,
        }
    }
}

#[cfg(feature = "native")]
impl Default for NativeApp {
    fn default() -> Self {
        Self::new()
    }
}
