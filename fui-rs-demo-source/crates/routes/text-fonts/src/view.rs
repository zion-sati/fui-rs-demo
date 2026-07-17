use crate::custom_font_section::CustomFontSection;
use crate::model::TextFontsModel;
use crate::rich_text_section::RichTextSection;
use fui::prelude::*;
use fui_rs_demo_shared::design_system::*;
use std::cell::Cell;
use std::rc::Rc;

const FIXED_LINE_HEIGHT_PX: f32 = 28.0;

pub struct TextFontsState {
    pub root: SelectionArea,
    pub form: Form,
    text_area: TextArea,
    read_only_toggle: Checkbox,
    wrapping_toggle: Checkbox,
    always_vertical_toggle: Checkbox,
    never_vertical_toggle: Checkbox,
    always_horizontal_toggle: Checkbox,
    never_horizontal_toggle: Checkbox,
    vertical_policy_group: RadioGroup,
    horizontal_policy_group: RadioGroup,
    line_height_group: RadioGroup,
    font_mode_group: RadioGroup,
    visibility_dropdown: Dropdown,
    focus_status: TextNode,
    selection_status: TextNode,
    settings_status: TextNode,
    focused: Cell<bool>,
    syncing_vertical: Cell<bool>,
    syncing_horizontal: Cell<bool>,
    rich_text: RichTextSection,
}

impl TextFontsState {
    pub fn new() -> Rc<Self> {
        let custom_font = CustomFontSection::new();
        let rich_text =
            RichTextSection::new(custom_font.emoji_face.clone(), custom_font.family.clone());
        let login = LoginFormSection::new();
        let text_area_section = TextAreaSection::new();
        let controls = text_area_section.build_panel(&login.form);
        let rich_panel = ui! {
            panel().width(800.0, Unit::Pixel) {
                demo_text("Static Rich Text", DemoTextStyle::Heading3),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                rich_text.container_text,
                vertical_spacer(10.0), rich_text.helper_text,
                vertical_spacer(10.0), rich_text.hint_text,
                vertical_spacer(PAGE_SECTION_GAP_PX),
            }
        };
        let font_panel = ui! {
            panel().width(800.0, Unit::Pixel) {
                demo_text("App-authored Custom Fonts", DemoTextStyle::Heading3),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                custom_font.heading_text,
                vertical_spacer(10.0), custom_font.body_text,
                vertical_spacer(10.0), custom_font.direct_stack_text,
                vertical_spacer(8.0), custom_font.comparison_text,
            }
        };
        let main_panel = ui! {
            panel().fill_size() {
                demo_text(TextFontsModel::TITLE, DemoTextStyle::Heading2),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                demo_text(TextFontsModel::SUBTITLE, DemoTextStyle::BodySecondary),
                vertical_spacer(HEADING_TO_BODY_GAP_PX),
                demo_text(TextFontsModel::DESCRIPTION, DemoTextStyle::BodySecondary),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                demo_scroll_box("AdvancedControlsScrollBox").fill_size() {
                    controls,
                    rich_panel,
                    font_panel,
                },
            }
        };
        let content = ui! {
            column()
                .fill_size()
                .min_width(800.0, Unit::Pixel)
                .min_height(600.0, Unit::Pixel)
                .padding(24.0, 24.0, 24.0, 24.0) {
                    create_nav_bar("Text & Fonts - FUI-RS Demo 🫶", "text-fonts"),
                    vertical_spacer(PAGE_SECTION_GAP_PX),
                    main_panel,
            }
        };
        let root = ui! {
            selection_area().fill_size() {
                demo_scroll_box("mainScrollBox").fill_size() { content },
            }
        };

        let state = Rc::new(Self {
            root,
            form: login.form.clone(),
            text_area: text_area_section.text_area.clone(),
            read_only_toggle: text_area_section.read_only_toggle.clone(),
            wrapping_toggle: text_area_section.wrapping_toggle.clone(),
            always_vertical_toggle: text_area_section.always_vertical_toggle.clone(),
            never_vertical_toggle: text_area_section.never_vertical_toggle.clone(),
            always_horizontal_toggle: text_area_section.always_horizontal_toggle.clone(),
            never_horizontal_toggle: text_area_section.never_horizontal_toggle.clone(),
            vertical_policy_group: text_area_section.vertical_policy_group.clone(),
            horizontal_policy_group: text_area_section.horizontal_policy_group.clone(),
            line_height_group: text_area_section.line_height_group.clone(),
            font_mode_group: text_area_section.font_mode_group.clone(),
            visibility_dropdown: text_area_section.visibility_dropdown.clone(),
            focus_status: text_area_section.focus_status.clone(),
            selection_status: text_area_section.selection_status.clone(),
            settings_status: text_area_section.settings_status.clone(),
            focused: Cell::new(false),
            syncing_vertical: Cell::new(false),
            syncing_horizontal: Cell::new(false),
            rich_text,
        });
        wire_events(
            &state,
            &login.username,
            &login.password,
            &login.sign_in,
            &login.clear,
            &login.status,
        );
        state.form.activate();
        state.apply_font_mode();
        state.sync_status();
        let weak = Rc::downgrade(&state);
        state.root.bind_theme(move |root, theme| {
            root.bg_color(theme.colors.background);
            if let Some(state) = weak.upgrade() {
                state.rich_text.sync_theme(theme);
                state.apply_font_mode();
            }
        });
        state
    }

    fn sync_status(&self) {
        self.focus_status.text(format!(
            "Focus: {} • Text length: {}",
            if self.focused.get() {
                "focused"
            } else {
                "blurred"
            },
            self.text_area.value().chars().count()
        ));
        self.selection_status.text(format!(
            "Selection: {}-{}",
            self.text_area.selection_start(),
            self.text_area.selection_end()
        ));
        let visibility = match self.visibility_dropdown.selected_index() {
            1 => "hidden",
            2 => "collapsed",
            _ => "normal",
        };
        self.settings_status.text(format!(
            "Read-only: {} • Wrapping: {} • Visibility: {} • Vertical: {} • Horizontal: {} • Line height: {} • Font: {}",
            on_off(self.read_only_toggle.is_checked()),
            on_off(self.wrapping_toggle.is_checked()),
            visibility,
            self.vertical_policy_group.selected_value(),
            self.horizontal_policy_group.selected_value(),
            if self.line_height_group.selected_value() == "fixed-28" { "fixed 28px" } else { "normal" },
            if self.font_mode_group.selected_value() == "mono" { "monospace" } else { "variable" },
        ));
    }

    fn apply_vertical_policy(&self) {
        self.syncing_vertical.set(true);
        match self.vertical_policy_group.selected_value().as_str() {
            "always" => {
                self.text_area
                    .vertical_scrollbar_visibility(ScrollBarVisibility::Always);
                self.always_vertical_toggle.check(true);
                self.never_vertical_toggle.check(false);
            }
            "never" => {
                self.text_area
                    .vertical_scrollbar_visibility(ScrollBarVisibility::Never);
                self.always_vertical_toggle.check(false);
                self.never_vertical_toggle.check(true);
            }
            _ => {
                self.text_area
                    .vertical_scrollbar_visibility(ScrollBarVisibility::Auto);
                self.always_vertical_toggle.check(false);
                self.never_vertical_toggle.check(false);
            }
        }
        self.syncing_vertical.set(false);
        self.sync_status();
    }

    fn apply_horizontal_policy(&self) {
        self.syncing_horizontal.set(true);
        match self.horizontal_policy_group.selected_value().as_str() {
            "always" => {
                self.text_area
                    .horizontal_scrollbar_visibility(ScrollBarVisibility::Always);
                self.always_horizontal_toggle.check(true);
                self.never_horizontal_toggle.check(false);
            }
            "never" => {
                self.text_area
                    .horizontal_scrollbar_visibility(ScrollBarVisibility::Never);
                self.always_horizontal_toggle.check(false);
                self.never_horizontal_toggle.check(true);
            }
            _ => {
                self.text_area
                    .horizontal_scrollbar_visibility(ScrollBarVisibility::Auto);
                self.always_horizontal_toggle.check(false);
                self.never_horizontal_toggle.check(false);
            }
        }
        self.syncing_horizontal.set(false);
        self.sync_status();
    }

    fn apply_font_mode(&self) {
        let theme = current_theme();
        if self.font_mode_group.selected_value() == "mono" {
            self.text_area
                .font_family(theme.fonts.mono_family)
                .font_size(theme.fonts.size_mono);
        } else {
            self.text_area
                .font_family(theme.fonts.body_family)
                .font_size(theme.fonts.size_body);
        }
        self.sync_status();
    }
}

mod events;
mod login_form;
mod text_area_section;
use events::*;
use login_form::*;
use text_area_section::*;
