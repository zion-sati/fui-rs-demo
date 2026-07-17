use super::*;

pub(super) struct TextAreaSection {
    pub(super) text_area: TextArea,
    pub(super) read_only_toggle: Checkbox,
    pub(super) wrapping_toggle: Checkbox,
    pub(super) always_vertical_toggle: Checkbox,
    pub(super) never_vertical_toggle: Checkbox,
    pub(super) always_horizontal_toggle: Checkbox,
    pub(super) never_horizontal_toggle: Checkbox,
    pub(super) vertical_policy_group: RadioGroup,
    pub(super) horizontal_policy_group: RadioGroup,
    pub(super) line_height_group: RadioGroup,
    pub(super) font_mode_group: RadioGroup,
    pub(super) visibility_dropdown: Dropdown,
    pub(super) focus_status: TextNode,
    pub(super) selection_status: TextNode,
    pub(super) settings_status: TextNode,
}

impl TextAreaSection {
    pub(super) fn new() -> Self {
        let text_area = ui! {
            text_area()
                .text("Line one\nLine two\nLine three\nLonger content so scrollbar policy is easy to spot.")
                .placeholder("Type notes here or paste sample content. Use the controls below to reconfigure the TextArea live.")
                .node_id("demo-advanced:text-area")
                .fill_width()
                .height(220.0, Unit::Pixel)
                .wrapping(true)
        };
        let read_only_toggle = demo_checkbox("Read-only");
        let wrapping_toggle = ui! { demo_checkbox("Wrapping").check(true) };
        let always_vertical_toggle = demo_checkbox("Always show vertical scrollbar");
        let never_vertical_toggle = demo_checkbox("Hide vertical scrollbar");
        let always_horizontal_toggle = demo_checkbox("Always show horizontal scrollbar");
        let never_horizontal_toggle = demo_checkbox("Hide horizontal scrollbar");
        let vertical_policy_group = policy_group(&[
            ("auto", "Vertical scrollbar: Auto"),
            ("always", "Vertical scrollbar: Always"),
            ("never", "Vertical scrollbar: Never"),
        ]);
        let horizontal_policy_group = policy_group(&[
            ("auto", "Horizontal scrollbar: Auto"),
            ("always", "Horizontal scrollbar: Always"),
            ("never", "Horizontal scrollbar: Never"),
        ]);
        let line_height_group = policy_group(&[
            ("normal", "Line height: Normal"),
            ("fixed-28", "Line height: Fixed 28 px"),
        ]);
        let font_mode_group = policy_group(&[
            ("variable", "Text font: Variable width"),
            ("mono", "Text font: Monospace"),
        ]);
        let visibility_dropdown = ui! {
            demo_dropdown()
                .items(vec![
                    DropdownItem::new("normal", "Visibility: Normal - keep layout reserved and content rendered"),
                    DropdownItem::new("hidden", "Visibility: Hidden - keep layout reserved but stop painting content"),
                    DropdownItem::new("collapsed", "Visibility: Collapsed - remove layout space and hide the content"),
                ])
                .select_index(0)
                .width(350.0, Unit::Pixel)
        };
        Self {
            text_area,
            read_only_toggle,
            wrapping_toggle,
            always_vertical_toggle,
            never_vertical_toggle,
            always_horizontal_toggle,
            never_horizontal_toggle,
            vertical_policy_group,
            horizontal_policy_group,
            line_height_group,
            font_mode_group,
            visibility_dropdown,
            focus_status: demo_text("", DemoTextStyle::Caption),
            selection_status: demo_text("", DemoTextStyle::Caption),
            settings_status: demo_text("", DemoTextStyle::BodySecondary),
        }
    }

    pub(super) fn build_panel(&self, login_form: &Form) -> FlexBox {
        ui! {
            panel().fill_width() {
                demo_text("Text Inputs", DemoTextStyle::Heading3),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                demo_text(
                    "This explicit Form projects username and password fields together so Proton Pass, browser autofill, and other password managers can recognize them. Enter submits; Escape clears.",
                    DemoTextStyle::BodySecondary,
                ),
                vertical_spacer(HEADING_TO_BODY_GAP_PX),
                login_form.clone(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                demo_text("Text Area", DemoTextStyle::Heading3),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                self.text_area.clone(),
                vertical_spacer(14.0),
                demo_text(
                    "Use the quick toggles for common changes, or the radio groups when you want an exact scrollbar or line-height setting.",
                    DemoTextStyle::BodySecondary,
                ),
                vertical_spacer(14.0),
                ui! { row() {
                    ui! { column() {
                        self.read_only_toggle.clone(),
                        vertical_spacer(8.0), self.wrapping_toggle.clone(),
                        vertical_spacer(8.0), self.always_vertical_toggle.clone(),
                        vertical_spacer(8.0), self.never_vertical_toggle.clone(),
                        vertical_spacer(8.0), self.always_horizontal_toggle.clone(),
                        vertical_spacer(8.0), self.never_horizontal_toggle.clone(),
                    }},
                    horizontal_spacer(96.0),
                    ui! { column() {
                        self.vertical_policy_group.clone(),
                        vertical_spacer(12.0), self.horizontal_policy_group.clone(),
                        vertical_spacer(12.0), self.line_height_group.clone(),
                        vertical_spacer(12.0), self.font_mode_group.clone(),
                        vertical_spacer(12.0), self.visibility_dropdown.clone(),
                    }},
                }},
                vertical_spacer(14.0), self.focus_status.clone(),
                vertical_spacer(6.0), self.selection_status.clone(),
                vertical_spacer(6.0), self.settings_status.clone(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
            }
        }
    }
}
