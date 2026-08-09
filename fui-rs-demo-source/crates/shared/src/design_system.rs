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
    ui! {
        button(label)
            .corner_radius(12.0)
            .padding(18.0, 10.0, 18.0, 10.0)
            .font_size(15.0)
            .width(0.0, Unit::Auto)
            .bind_theme(move |control, theme| {
                if tone == DemoButtonTone::Primary {
                    control.colors(
                        ButtonColors::new()
                            .background(theme.colors.accent)
                            .text_primary(theme.colors.text_on_accent),
                    );
                } else {
                    control.colors(
                        ButtonColors::new()
                            .background(theme.colors.surface)
                            .text_primary(theme.colors.text_primary),
                    );
                }
            })
    }
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
    ui! {
        column()
            .align_items(AlignItems::Start)
            .padding(24.0, 24.0, 24.0, 24.0)
            .margin(12.0, 12.0, 12.0, 12.0)
            .corner_radius(16.0)
            .bind_theme(|panel, theme| {
                panel
                    .border(1.0, theme.colors.border)
                    .bg_color(theme.colors.surface)
                    .drop_shadow(theme.colors.panel_shadow, 0.0, 2.0, 7.0, 0.0);
            })
    }
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

fn nav_pill(href: &str, label: &str, active: bool) -> NavLink {
    let pill = NavLink::with_label(href, label);
    pill.text(label)
        .corner_radius(999.0)
        .padding(16.0, 8.0, 16.0, 8.0);
    pill.bind_theme(move |link, theme| {
        link.bg_color(if active {
            theme.colors.accent
        } else {
            theme.colors.surface
        })
        .text_color(if active {
            theme.colors.text_on_accent
        } else {
            theme.colors.text_muted
        });
    });
    pill
}

pub fn create_nav_bar(title: &str, active_slug: &str) -> FlexBox {
    ui! {
        row().fill_width().flex_wrap(FlexWrap::Wrap) {
            demo_text(title, DemoTextStyle::Heading1)
                .text_vertical_align(TextVerticalAlign::Center)
                .width(50.0, Unit::Percent),
            row()
                .justify_content(JustifyContent::End)
                .fill_width_percent(50.0)
                .flex_wrap(FlexWrap::Wrap) {
                    nav_pill("/", "Home", active_slug == "home"),
                    horizontal_spacer(10.0),
                    nav_pill("/text-fonts/", "Text & Fonts", active_slug == "text-fonts"),
                    horizontal_spacer(10.0),
                    nav_pill("/advanced/", "Advanced", active_slug == "advanced"),
                    horizontal_spacer(10.0),
                    nav_pill("/immediate-drawing/", "Immediate Drawing", active_slug == "immediate-drawing"),
            },
        }
    }
}
