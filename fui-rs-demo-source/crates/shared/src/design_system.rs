use std::cell::RefCell;
use std::rc::Rc;

use fui::prelude::*;

pub const PAGE_SECTION_GAP_PX: f32 = 24.0;
pub const PANEL_SECTION_GAP_PX: f32 = 16.0;
pub const HEADING_TO_BODY_GAP_PX: f32 = 12.0;
pub const HEADING_TO_BODY_TIGHT_GAP_PX: f32 = 8.0;
pub const TITLE_TO_SUPPORTING_GAP_PX: f32 = 10.0;
pub const LABEL_TO_CONTROL_GAP_PX: f32 = 6.0;
pub const MICRO_STACK_GAP_PX: f32 = 4.0;

#[derive(Clone, Copy)]
pub enum DemoTextStyle {
    Heading1,
    Heading2,
    Heading3,
    Lead,
    Label,
    Body,
    BodySecondary,
    Caption,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum DemoButtonTone {
    Primary,
    Secondary,
}

fn demo_button_colors(tone: DemoButtonTone, theme: &Theme) -> ButtonColors {
    if tone == DemoButtonTone::Primary {
        return ButtonColors::new()
            .background(theme.colors.accent)
            .background_hover(theme.colors.accent_hovered)
            .background_pressed(theme.colors.accent_pressed)
            .text_primary(theme.colors.text_on_accent)
            .border(theme.colors.accent);
    }

    ButtonColors::new()
        .background(theme.colors.surface)
        .background_hover(fui::color::mix_color(
            theme.colors.surface,
            theme.colors.accent,
            0.18,
        ))
        .background_pressed(fui::color::mix_color(
            theme.colors.surface,
            theme.colors.accent,
            0.30,
        ))
        .text_primary(theme.colors.text_primary)
        .border(theme.colors.border)
}

pub fn demo_text(value: impl Into<String>, style: DemoTextStyle) -> TextNode {
    let (font_size, font_weight, muted) = match style {
        DemoTextStyle::Heading1 => (26.0, FontWeight::Bold, false),
        DemoTextStyle::Heading2 => (22.0, FontWeight::Bold, false),
        DemoTextStyle::Heading3 => (18.0, FontWeight::Bold, false),
        DemoTextStyle::Lead => (17.0, FontWeight::Regular, false),
        DemoTextStyle::Label => (16.0, FontWeight::Regular, false),
        DemoTextStyle::Body => (15.0, FontWeight::Regular, false),
        DemoTextStyle::BodySecondary => (14.0, FontWeight::Regular, true),
        DemoTextStyle::Caption => (12.0, FontWeight::Regular, true),
    };
    ui! {
        text(value)
            .font_size(font_size)
            .font_weight(font_weight)
            .bind_theme(move |node, theme| {
                node.text_color(if muted { theme.colors.text_muted } else { theme.colors.text_primary });
            })
    }
}

pub fn demo_button(label: impl Into<String>, tone: DemoButtonTone) -> Button {
    let control = button(label);
    apply_demo_button_style(&control, tone);
    control
}

pub fn apply_demo_button_style(control: &Button, tone: DemoButtonTone) -> &Button {
    control
        .corner_radius(12.0)
        .padding(18.0, 10.0, 18.0, 10.0)
        .font_size(15.0)
        .width(0.0, Unit::Auto)
        .bind_theme(move |control, theme| {
            control.colors(demo_button_colors(tone, &theme));
        })
}

pub fn section_panel(title: impl Into<String>) -> FlexBox {
    ui! {
        panel().fill_width() {
            demo_text(title, DemoTextStyle::Heading3),
            vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
        }
    }
}

pub fn vertical_spacer(height: f32) -> FlexBox {
    flex_box().height(height, Unit::Pixel).clone()
}

pub fn horizontal_spacer(width: f32) -> FlexBox {
    flex_box().width(width, Unit::Pixel).clone()
}

pub fn panel() -> FlexBox {
    let panel = ui! {
        column()
            .align_items(AlignItems::Start)
            .corner_radius(16.0)
            .bind_theme(|panel, theme| {
                panel
                    .border(1.0, theme.colors.border)
                    .bg_color(theme.colors.surface)
                    .drop_shadow(theme.colors.panel_shadow, 0.0, 2.0, 7.0, 0.0);
            })
    };
    apply_panel_spacing(&panel, is_compact_layout());
    NEW_PANELS.with(|panels| panels.borrow_mut().push(panel.clone()));
    panel
}

/// Nested panels keep less of a phone's width for their own spacing in the compact layout.
fn apply_panel_spacing(panel: &FlexBox, compact: bool) {
    let (padding, margin) = if compact { (14.0, 6.0) } else { (24.0, 12.0) };
    panel
        .padding(padding, padding, padding, padding)
        .margin(margin, margin, margin, margin);
}

pub fn primary_button(label: impl Into<String>) -> Button {
    demo_button(label, DemoButtonTone::Primary)
}

pub fn demo_checkbox(label: impl Into<String>) -> Checkbox {
    ui! {
        checkbox(label).sizing(
            LabeledControlSizing::new().indicator_size(18.0).label_font_size(14.0),
        )
    }
}

pub fn demo_radio(value: impl Into<String>, label: impl Into<String>) -> RadioButton {
    ui! {
        RadioButton::with_label(value, label).sizing(
            LabeledControlSizing::new().indicator_size(21.0).label_font_size(14.0),
        )
    }
}

pub fn demo_dropdown() -> Dropdown {
    ui! {
        dropdown().sizing(
            DropdownSizing::new()
                .field_font_size(14.0)
                .option_font_size(14.0)
                .field_height(34.0)
                .option_height(34.0)
                .chevron_box_size(16.0)
                .chevron_icon_size(12.0),
        )
        .width(240.0, Unit::Pixel)
        .max_visible_items(5)
    }
}

pub fn demo_slider(value: f32) -> Slider {
    ui! {
        slider()
            .value(value)
            .sizing(SliderSizing::new().thumb_size(16.0).track_thickness(4.0))
    }
}

pub fn demo_scroll_box(name: impl Into<String>) -> ScrollBox {
    ui! {
        scroll_box()
        .node_id(name)
        .scroll_enabled_x(true)
        .scroll_enabled_y(true)
        .horizontal_scrollbar_visibility(ScrollBarVisibility::Auto)
        .vertical_scrollbar_visibility(ScrollBarVisibility::Auto)
        .scrollbar_style(
            ScrollBarStyle::new()
                .track_corner_radius(8.0)
                .thumb_corner_radius(8.0),
        )
    }
}

pub fn apply_row_background(row: &FlexBox, index: i32, theme: &Theme) {
    let alpha = if index & 1 == 0 { 36 } else { 22 };
    row.bg_color(with_alpha(theme.colors.accent, alpha))
        .border(1.0, theme.colors.border);
}

#[cfg(not(feature = "native-runtime"))]
fn nav_pill(href: &str, label: &str, active: bool) -> NavLink {
    let label_node = text(label);
    label_node.font_size(14.0).selectable(false);
    let pill = NavLink::new(href);
    pill.child(&label_node)
        .semantic_label(label)
        .corner_radius(999.0)
        .padding(16.0, 8.0, 16.0, 8.0);
    pill.bind_interaction_state({
        let label_node = label_node.clone();
        move |state, theme| {
            label_node.text_color(if active {
                theme.colors.text_on_accent
            } else if state.hovered || state.pressed {
                theme.colors.accent_hovered
            } else {
                theme.colors.text_muted
            });
        }
    });
    pill.bind_theme(move |link, theme| {
        link.bg_color(if active {
            theme.colors.accent
        } else {
            theme.colors.surface
        });
    });
    pill
}

pub fn demo_nav_link(href: &str, label: &str) -> NavLink {
    let label_node = text(label);
    label_node.font_size(14.0).selectable(false);
    let link = NavLink::new(href);
    link.child(&label_node).semantic_label(label);
    link.bind_interaction_state(move |state, theme| {
        label_node.text_color(if state.hovered || state.pressed {
            theme.colors.accent_hovered
        } else {
            theme.colors.accent
        });
    });
    link
}

/// A viewport narrower than this gets the compact layout: one column, no minimum page width, tighter padding.
pub const COMPACT_LAYOUT_MAX_WIDTH_PX: f32 = 860.0;
const PAGE_MIN_WIDTH_PX: f32 = 800.0;
pub const PAGE_MIN_HEIGHT_PX: f32 = 600.0;
const NAV_PILL_GAP_PX: f32 = 10.0;

pub fn is_compact_layout() -> bool {
    let width = viewport_width_signal().value();
    width > 0.0 && width < COMPACT_LAYOUT_MAX_WIDTH_PX
}

thread_local! {
    // The panels built since a page last collected them, so each page lays out its own panels.
    static NEW_PANELS: RefCell<Vec<FlexBox>> = const { RefCell::new(Vec::new()) };
}

/// Keeps a page matched to the viewport, wide or compact, for as long as the page holds it.
#[derive(Clone)]
pub struct CompactLayout {
    _subscription: Rc<fui::signal::SubscriptionGuard>,
}

impl CompactLayout {
    pub fn new(apply: impl Fn(bool) + 'static) -> Self {
        apply(is_compact_layout());
        let subscription = viewport_width_signal().subscribe(move |_| apply(is_compact_layout()));
        Self {
            _subscription: Rc::new(subscription),
        }
    }
}

/// A route's title and links. In the compact layout the links wrap on their own line under the title.
#[derive(Clone)]
pub struct RouteChrome {
    root: FlexBox,
    nav: Option<(TextNode, FlexBox, Vec<NavLink>)>,
}

impl RouteChrome {
    pub fn root(&self) -> FlexBox {
        self.root.clone()
    }

    fn apply_layout(&self, compact: bool) {
        let Some((title, links, pills)) = &self.nav else {
            return;
        };
        title.width(if compact { 100.0 } else { 50.0 }, Unit::Percent);
        links
            .fill_width_percent(if compact { 100.0 } else { 50.0 })
            .justify_content(if compact {
                JustifyContent::Start
            } else {
                JustifyContent::End
            })
            .margin(0.0, if compact { 12.0 } else { 0.0 }, 0.0, 0.0);
        // A gap after each pill, and in the compact layout below it too, so wrapped rows stay apart.
        for (index, pill) in pills.iter().enumerate() {
            let right = if index + 1 == pills.len() {
                0.0
            } else {
                NAV_PILL_GAP_PX
            };
            pill.margin(0.0, 0.0, right, if compact { NAV_PILL_GAP_PX } else { 0.0 });
        }
    }
}

pub fn create_route_chrome(title: &str, active_slug: &str, bottom_gap: f32) -> RouteChrome {
    #[cfg(feature = "native-runtime")]
    {
        let _ = (title, active_slug, bottom_gap);
        RouteChrome {
            root: row().height(0.0, Unit::Pixel).clone(),
            nav: None,
        }
    }

    #[cfg(not(feature = "native-runtime"))]
    {
        let title_text = demo_text(title, DemoTextStyle::Heading1);
        title_text.text_vertical_align(TextVerticalAlign::Center);
        let pills = vec![
            nav_pill("/", "Home", active_slug == "home"),
            nav_pill("/text-fonts/", "Text & Fonts", active_slug == "text-fonts"),
            nav_pill("/advanced/", "Advanced", active_slug == "advanced"),
            nav_pill(
                "/immediate-drawing/",
                "Immediate Drawing",
                active_slug == "immediate-drawing",
            ),
        ];
        let links = row().flex_wrap(FlexWrap::Wrap).clone();
        for pill in &pills {
            links.child(pill);
        }
        let root = ui! {
            column().fill_width() {
                row().fill_width().flex_wrap(FlexWrap::Wrap) {
                    title_text.clone(),
                    links.clone(),
                },
                vertical_spacer(bottom_gap),
            }
        };
        RouteChrome {
            root,
            nav: Some((title_text, links, pills)),
        }
    }
}

/// Keeps a route page matched to the viewport: `page` is the column under the main scroll box, `content_scroll` the
/// scroll box in the main panel, which fits the width in the compact layout, and the panels built for the page so far
/// are collected. A page whose content stacks can ask for more height in the compact layout, so the page scrolls; and
/// `extra` applies a layout of the page's own.
pub fn page_compact_layout(
    page: &FlexBox,
    chrome: &RouteChrome,
    content_scroll: Option<&ScrollBox>,
    compact_min_height: f32,
    extra: impl Fn(bool) + 'static,
) -> CompactLayout {
    let page = page.clone();
    let chrome = chrome.clone();
    let content_scroll = content_scroll.cloned();
    let panels = NEW_PANELS.with(|panels| std::mem::take(&mut *panels.borrow_mut()));
    CompactLayout::new(move |compact| {
        let padding = if compact { 12.0 } else { 24.0 };
        page.min_width(if compact { 0.0 } else { PAGE_MIN_WIDTH_PX }, Unit::Pixel)
            .min_height(
                if compact {
                    compact_min_height
                } else {
                    PAGE_MIN_HEIGHT_PX
                },
                Unit::Pixel,
            )
            .padding(padding, padding, padding, padding);
        chrome.apply_layout(compact);
        if let Some(scroll) = &content_scroll {
            scroll.scroll_enabled_x(!compact);
        }
        for panel in &panels {
            apply_panel_spacing(panel, compact);
        }
        extra(compact);
    })
}
