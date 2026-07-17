use super::*;

pub(super) struct LoginFormSection {
    pub(super) form: Form,
    pub(super) username: TextInput,
    pub(super) password: TextInput,
    pub(super) sign_in: Button,
    pub(super) clear: Button,
    pub(super) status: TextNode,
}

impl LoginFormSection {
    pub(super) fn new() -> Self {
        let username = ui! {
            text_input()
                .semantic_label("Username or email")
                .placeholder("Username or email")
                .host_autofill("username")
                .node_id("public-demo-username")
                .fill_width()
        };
        let password = ui! {
            text_input()
                .semantic_label("Password")
                .placeholder("Password")
                .password(true)
                .host_autofill("current-password")
                .node_id("public-demo-current-password")
                .fill_width()
        };
        let sign_in = primary_button("Sign in");
        let clear = primary_button("Clear");
        let status = demo_text(
            "Password managers should recognize this projected login form. No credentials are sent anywhere.",
            DemoTextStyle::BodySecondary,
        );
        let login_grid = ui! {
            grid()
                .columns([GridTrack::px(180.0), GridTrack::star(1.0)])
                .rows([GridTrack::px(40.0), GridTrack::px(12.0), GridTrack::px(40.0)])
                .width(500.0, Unit::Pixel)
        };
        let username_label = ui! {
            demo_text("Username or email:   ", DemoTextStyle::Body)
                .text_vertical_align(TextVerticalAlign::Center)
                .text_align(TextAlign::Right)
        };
        let password_label = ui! {
            demo_text("Password:   ", DemoTextStyle::Body)
                .text_vertical_align(TextVerticalAlign::Center)
                .text_align(TextAlign::Right)
        };
        login_grid
            .place_child(&username_label, 0, 0, 1, 1)
            .place_child(&username, 0, 1, 1, 1)
            .place_child(&password_label, 2, 0, 1, 1)
            .place_child(&password, 2, 1, 1, 1);
        let form = ui! {
            form()
                .default_btn(&sign_in)
                .cancel_btn(&clear)
                .fill_width() {
                    login_grid,
                    vertical_spacer(14.0),
                    ui! { row() { sign_in, horizontal_spacer(12.0), clear } },
                    vertical_spacer(10.0),
                    status,
            }
        };
        Self {
            form,
            username,
            password,
            sign_in,
            clear,
            status,
        }
    }
}
