use super::*;
pub(super) fn create_controls_images_panel(bitmap: &Bitmap) -> FlexBox {
    ui! {
        panel() {
            demo_text("Images with Transparency", DemoTextStyle::Heading3),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 1: Local JPG with no transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(0)
                .source("/images/golden-gate-bridge.jpg")
                .object_fit(ObjectFit::Cover)
                .alt_text("Sample image1 - JPG")
                .width(640.0, Unit::Pixel)
                .height(480.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Sample image1 - JPG").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 2: Remote HTTPS PNG with transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(0)
                .source("https://upload.wikimedia.org/wikipedia/commons/6/67/1932_eagle_reverse%28Transparency%29.png")
                .object_fit(ObjectFit::Cover)
                .alt_text("Remote HTTPS PNG with transparency")
                .tool_tip(ToolTip::text("Remote HTTPS PNG loaded by the active host").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 3: Remote HTTPS SVG", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            svg(0)
                .source("https://upload.wikimedia.org/wikipedia/commons/d/d0/Drawsvgbird.svg")
                .alt_text("Remote HTTPS SVG image")
                .height(600.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Remote HTTPS SVG loaded by the active host").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 4: Remote HTTPS image", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(0)
                .source("https://placehold.co/640x360/1D4ED8/FFFFFF/png?text=Remote+HTTPS+asset")
                .object_fit(ObjectFit::Cover)
                .alt_text("Remote HTTPS image")
                .width(640.0, Unit::Pixel)
                .height(480.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Remote HTTPS image loaded by the active host").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 5: Remote HTTPS SVG", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            svg(0)
                .source("https://placehold.co/640x360.svg?text=Remote+HTTPS+SVG")
                .alt_text("Remote HTTPS SVG")
                .width(640.0, Unit::Pixel)
                .height(360.0, Unit::Pixel)
                .tool_tip(ToolTip::text("Remote HTTPS SVG loaded by the active host").initial_show_delay(1000)),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 6: Custom bitmap", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            image(bitmap.texture_id())
                .object_fit(ObjectFit::Contain)
                .alt_text("App-owned premultiplied RGBA bitmap sample")
                .tool_tip(ToolTip::text("App-owned premultiplied RGBA bitmap sample").initial_show_delay(1000)),
        }
    }
}
