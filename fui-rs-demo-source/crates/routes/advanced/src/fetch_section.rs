use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    demo_button, demo_text, section_panel, vertical_spacer, DemoButtonTone, DemoTextStyle,
};
use std::cell::RefCell;
use std::rc::Rc;

const GET_URL: &str = "https://jsonplaceholder.typicode.com/todos/1";
const POST_URL: &str = "https://jsonplaceholder.typicode.com/posts";

pub(crate) fn create_fetch_section() -> FlexBox {
    let status = demo_text("Fetch status: idle", DemoTextStyle::Body);
    let result = ui! { demo_text("Fetch result: none", DemoTextStyle::BodySecondary).max_lines(5) };
    let active = Rc::new(RefCell::new(None::<FetchRequest>));
    let make_request = |button_label: &'static str, method: &'static str, url: &'static str| {
        let tone = if method == "POST" {
            DemoButtonTone::Primary
        } else {
            DemoButtonTone::Secondary
        };
        let control = ui! { demo_button(button_label, tone).width(170.0, Unit::Pixel).height(60.0, Unit::Pixel) };
        control.on_click({
            let active = active.clone();
            let status = status.clone();
            let result = result.clone();
            move |_| {
                active.borrow_mut().take();
                status.text(format!("Fetch status: {} pending", method));
                result.text(format!("Fetch result: requesting {}", url));
                let mut request = Fetch::request(url);
                if method == "POST" {
                    request = request
                        .method("POST")
                        .header("Content-Type", "application/json; charset=UTF-8")
                        .body_text(
                            r#"{"title":"EffinDOM","body":"Advanced fetch demo","userId":1}"#,
                        );
                }
                request = request
                    .on_complete({
                        let active = active.clone();
                        let status = status.clone();
                        let result = result.clone();
                        move |response| {
                            active.borrow_mut().take();
                            status.text(format!("Fetch status: {} complete", method));
                            result.text(format!(
                                "Fetch result: ok={} • {} {} • {}",
                                response.ok, response.status, response.status_text, response.url
                            ));
                        }
                    })
                    .on_error({
                        let active = active.clone();
                        let status = status.clone();
                        let result = result.clone();
                        move |event| {
                            active.borrow_mut().take();
                            status.text(format!("Fetch status: {} error", method));
                            result.text(format!("Fetch result: {}", event.message));
                        }
                    })
                    .start();
                active.borrow_mut().replace(request);
            }
        });
        control
    };
    let section = ui! {
        section_panel("Online Fetch Sample") {
            demo_text("Issue GET and POST requests through the browser Fetch API.", DemoTextStyle::Body),
            vertical_spacer(12.0),
            row().flex_wrap(FlexWrap::Wrap) {
                make_request("GET /posts/1", "GET", GET_URL),
                flex_box().width(12.0, Unit::Pixel),
                make_request("POST /posts", "POST", POST_URL),
            },
            vertical_spacer(12.0),
            status,
            vertical_spacer(6.0),
            result,
        }
    };
    section
}
