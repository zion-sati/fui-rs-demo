use super::*;
pub(super) fn create_controls_images_panel(bitmap: &Bitmap) -> FlexBox {
    ui! {
        panel() {
            demo_text("Images with Transparency", DemoTextStyle::Heading3),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 1: JPG with no transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(0)
                .source("https://upload.wikimedia.org/wikipedia/commons/d/d3/Golden_Gate_Bridge_at_sunset_1.jpg")
                .object_fit(ObjectFit::Cover)
                .alt_text("Sample image1 - JPG")
                .width(640.0, Unit::Pixel)
                .height(480.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Sample image1 - JPG").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 2: PNG with transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(0)
                .source("https://upload.wikimedia.org/wikipedia/commons/6/67/1932_eagle_reverse%28Transparency%29.png")
                .object_fit(ObjectFit::Cover)
                .alt_text("Sample image2 - PNG with transparency")
                .tool_tip(ToolTip::text("Sample image2 - PNG with transparency").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 3: SVG", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            svg(0)
                .source("https://upload.wikimedia.org/wikipedia/commons/d/d0/Drawsvgbird.svg")
                .alt_text("Sample SVG image")
                .height(600.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Sample SVG image").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 4: Custom bitmap", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(bitmap.texture_id())
                .object_fit(ObjectFit::Contain)
                .alt_text("App-owned premultiplied RGBA bitmap sample")
                .tool_tip(ToolTip::text("App-owned premultiplied RGBA bitmap sample").initial_show_delay(1000)),
        }
    }
}
