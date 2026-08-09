use fui::prelude::*;
use fui_rs_demo_shared::design_system::*;

pub struct CustomFontSection {
    pub emoji_face: FontFace,
    pub family: FontFamily,
    pub heading_text: TextNode,
    pub body_text: TextNode,
    pub direct_stack_text: TextNode,
    pub comparison_text: TextNode,
}

impl CustomFontSection {
    pub fn new() -> Self {
        let emoji_face = FontFace::load("/runtime/fonts/NotoColorEmoji.ttf");
        let body_stack =
            FontStack::load("/runtime/fonts/DejaVuSans.ttf").fallback_face(emoji_face.clone());
        let heading_stack =
            FontStack::load("/runtime/fonts/DejaVuSans-Bold.ttf").fallback_face(emoji_face.clone());
        let family = FontFamily::regular_bold_stacks(body_stack.clone(), heading_stack);
        let heading_text = demo_text("Custom DejaVu FontStack sample 🌍", DemoTextStyle::Heading2);
        heading_text.font_family(family.clone());
        let body_text = demo_text(
            "Load DejaVu Sans through FontStack::load(...), use DejaVu Bold for heavier text, and keep color emoji fallback through the same typography API.",
            DemoTextStyle::BodySecondary,
        );
        body_text.font_family(family.clone()).font_size(16.0);
        let direct_stack_text = demo_text(
            "Apply a stack directly: TextNode::font_stack(custom_body_stack, 17) ✨",
            DemoTextStyle::BodySecondary,
        );
        direct_stack_text.font_stack(body_stack, 17.0);
        let comparison_text = demo_text(
            "Bold family resolution stays intact: DejaVu Bold + emoji fallback 😄",
            DemoTextStyle::Body,
        );
        comparison_text
            .font_family(family.clone())
            .font_weight(FontWeight::Bold)
            .font_size(18.0);
        Self {
            emoji_face,
            family,
            heading_text,
            body_text,
            direct_stack_text,
            comparison_text,
        }
    }
}
