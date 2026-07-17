use fui::prelude::*;
use fui_rs_demo_shared::design_system::*;

pub struct RichTextSection {
    pub container_text: RichText,
    pub helper_text: RichText,
    pub hint_text: TextNode,
    emoji_face: FontFace,
    family: FontFamily,
}

impl RichTextSection {
    pub fn new(emoji_face: FontFace, family: FontFamily) -> Self {
        let container_text = RichText::new(Vec::new());
        container_text
            .font_family(family.clone())
            .font_weight(FontWeight::Bold)
            .font_size(20.0)
            .line_height(28.0)
            .max_lines(1)
            .fill_width();
        let helper_text = RichText::new(Vec::new());
        helper_text
            .font_family(family.clone())
            .font_size(18.0)
            .line_height(26.0)
            .max_lines(1)
            .fill_width();
        Self {
            container_text,
            helper_text,
            hint_text: demo_text(
                "Use helper spans to compose inline styling, and use RichText container defaults when you want the same font family, weight, size, or color across the whole object.",
                DemoTextStyle::BodySecondary,
            ),
            emoji_face,
            family,
        }
    }

    pub fn sync_theme(&self, theme: Theme) {
        let primary = theme.colors.text_primary;
        self.container_text.fragments_value(vec![
            span("Base family ").underline().text_color(primary),
            span("with ").text_color(primary),
            span("CUSTOM OVERRIDE")
                .font_family(self.family.clone())
                .font_weight(FontWeight::Bold)
                .strikethrough(),
        ]);
        self.helper_text.fragments_value(vec![
            span("Rich ").bold().text_color(primary),
            span("text ").italic().text_color(rgb(0x60, 0xa5, 0xfa)),
            span("underline ").underline().text_color(rgb(0xfb, 0xbf, 0x24)),
            span("strike ").strikethrough().text_color(rgb(0xf8, 0x71, 0x71)),
            span("emoji- ")
                .background_color(rgb(0x1e, 0x29, 0x3b))
                .text_color(rgb(0xa7, 0xf3, 0xd0)),
            span("😄")
                .font_family(FontFamily::with_regular_face(self.emoji_face.clone()))
                .background_color(rgb(0x1e, 0x29, 0x3b))
                .text_color(rgb(0xa7, 0xf3, 0xd0)),
            span(" ")
                .background_color(rgb(0x1e, 0x29, 0x3b))
                .text_color(rgb(0xa7, 0xf3, 0xd0)),
            span("helpers")
                .bold()
                .italic()
                .underline()
                .strikethrough()
                .text_color(rgb(0xcb, 0xd5, 0xe1)),
        ]);
    }
}
