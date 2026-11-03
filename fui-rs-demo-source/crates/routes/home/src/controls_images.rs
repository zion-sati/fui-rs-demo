use super::*;
/// The images panel, and how it fits the layout: in the compact layout each image shrinks to the compact sample
/// width, keeping its proportions.
pub(super) fn create_controls_images_panel(bitmap: &Bitmap) -> (FlexBox, impl Fn(bool)) {
    let local_jpg = ui! {
        image(0)
            .source("/images/golden-gate-bridge.jpg")
            .object_fit(ObjectFit::Cover)
            .alt_text("Sample image1 - JPG")
            .tool_tip(ToolTip::text("Sample image1 - JPG").initial_show_delay(1000))
    };
    let remote_png = ui! {
        image(0)
            .source("https://upload.wikimedia.org/wikipedia/commons/6/67/1932_eagle_reverse%28Transparency%29.png")
            .object_fit(ObjectFit::Cover)
            .alt_text("Remote HTTPS PNG with transparency")
            .tool_tip(ToolTip::text("Remote HTTPS PNG loaded by the active host").initial_show_delay(1000))
    };
    let remote_svg = ui! {
        svg(0)
            .source("https://upload.wikimedia.org/wikipedia/commons/d/d0/Drawsvgbird.svg")
            .alt_text("Remote HTTPS SVG image")
            .tool_tip(ToolTip::text("Remote HTTPS SVG loaded by the active host").initial_show_delay(1000))
    };
    let remote_image = ui! {
        image(0)
            .source("https://placehold.co/640x360/1D4ED8/FFFFFF/png?text=Remote+HTTPS+asset")
            .object_fit(ObjectFit::Cover)
            .alt_text("Remote HTTPS image")
            .tool_tip(ToolTip::text("Remote HTTPS image loaded by the active host").initial_show_delay(1000))
    };
    let placeholder_svg = ui! {
        svg(0)
            .source("https://placehold.co/640x360.svg?text=Remote+HTTPS+SVG")
            .alt_text("Remote HTTPS SVG")
            .tool_tip(ToolTip::text("Remote HTTPS SVG loaded by the active host").initial_show_delay(1000))
    };
    let bitmap_image = ui! {
        image(bitmap.texture_id())
            .object_fit(ObjectFit::Contain)
            .alt_text("App-owned premultiplied RGBA bitmap sample")
            .tool_tip(ToolTip::text("App-owned premultiplied RGBA bitmap sample").initial_show_delay(1000))
    };
    let panel = ui! {
        panel() {
            demo_text("Images with Transparency", DemoTextStyle::Heading3),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 1: Local JPG with no transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            local_jpg.clone(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text(
                "Image 2: Remote HTTPS PNG with transparency",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            remote_png.clone(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 3: Remote HTTPS SVG", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            remote_svg.clone(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 4: Remote HTTPS image", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            remote_image.clone(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 5: Remote HTTPS SVG", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            placeholder_svg.clone(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Image 6: Custom bitmap", DemoTextStyle::BodySecondary),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            bitmap_image.clone(),
        }
    };
    let apply_layout = move |compact: bool| {
        if compact {
            // A fixed width with an automatic height keeps each image's proportions.
            for image in [&local_jpg, &remote_png, &remote_image, &bitmap_image] {
                image
                    .width(COMPACT_SAMPLE_WIDTH_PX, Unit::Pixel)
                    .height(0.0, Unit::Auto);
            }
            for svg in [&remote_svg, &placeholder_svg] {
                svg.width(COMPACT_SAMPLE_WIDTH_PX, Unit::Pixel)
                    .height(0.0, Unit::Auto);
            }
        } else {
            local_jpg
                .width(640.0, Unit::Pixel)
                .height(480.0, Unit::Pixel);
            remote_png.width(0.0, Unit::Auto).height(0.0, Unit::Auto);
            remote_svg.width(0.0, Unit::Auto).height(600.0, Unit::Pixel);
            remote_image
                .width(640.0, Unit::Pixel)
                .height(480.0, Unit::Pixel);
            placeholder_svg
                .width(640.0, Unit::Pixel)
                .height(360.0, Unit::Pixel);
            bitmap_image.width(0.0, Unit::Auto).height(0.0, Unit::Auto);
        }
    };
    (panel, apply_layout)
}
