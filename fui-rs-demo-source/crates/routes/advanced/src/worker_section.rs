use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    demo_button, demo_text, section_panel, vertical_spacer, DemoButtonTone, DemoTextStyle,
};
use std::cell::RefCell;
use std::rc::Rc;

pub(crate) fn create_worker_section() -> FlexBox {
    let status = demo_text("", DemoTextStyle::Body);
    let detail = demo_text("", DemoTextStyle::BodySecondary);
    let progress = ui! { progress_bar().length(320.0).value(0.0) };
    let active = Rc::new(RefCell::new(None::<Worker>));
    let start = ui! { demo_button("Start prime worker", DemoButtonTone::Primary).width(170.0, Unit::Pixel).height(60.0, Unit::Pixel) };
    let cancel = ui! { demo_button("Cancel prime worker", DemoButtonTone::Secondary).width(170.0, Unit::Pixel).height(60.0, Unit::Pixel) };
    start.on_click({
        let active = active.clone();
        let status = status.clone();
        let detail = detail.clone();
        let progress = progress.clone();
        move |_| {
            if active.borrow().is_some() {
                return;
            }
            progress.value(0.0);
            status.text("Worker: computing primes...");
            detail.text("");
            let worker = Worker::new("../advanced-workers.wasm", "advancedPrimeWorker")
                .on_progress({
                    let detail = detail.clone();
                    let progress = progress.clone();
                    move |event| {
                        let percent = event.message.parse::<f32>().unwrap_or(0.0);
                        progress.value(percent);
                        detail.text(format!("Prime search progress: {:.0}%.", percent));
                    }
                })
                .on_complete({
                    let active = active.clone();
                    let status = status.clone();
                    let detail = detail.clone();
                    let progress = progress.clone();
                    move |event| {
                        active.borrow_mut().take();
                        progress.value(100.0);
                        status.text("Worker: completed");
                        detail.text(format!("Largest prime after 5s: {}", event.result));
                    }
                })
                .on_error({
                    let active = active.clone();
                    let status = status.clone();
                    let detail = detail.clone();
                    let progress = progress.clone();
                    move |event| {
                        active.borrow_mut().take();
                        if let Some(percent) = event.message.strip_prefix("cancelled:") {
                            let percent = percent.parse::<f32>().unwrap_or(0.0);
                            progress.value(percent);
                            status.text("Worker: cancelled");
                            detail.text(format!(
                                "Prime search cancelled after yielding at {:.0}%.",
                                percent
                            ));
                        } else {
                            status.text("Worker: error");
                            detail.text(format!("Worker error: {}", event.message));
                        }
                    }
                })
                .start("advanced-demo");
            active.borrow_mut().replace(worker);
        }
    });
    cancel.on_click({
        let active = active.clone();
        move |_| {
            if let Some(worker) = active.borrow().as_ref() {
                worker.cancel();
            }
        }
    });
    let section = ui! {
        section_panel("ProgressBar + Worker Sample") {
            demo_text("This sample connects the Worker API to a retained ProgressBar. Start runs a 5-second prime search with frequent cooperative yields; cancel waits for the next yield and then reports cancellation.", DemoTextStyle::Body),
            vertical_spacer(12.0),
            row().fill_width().align_items(AlignItems::Stretch) { start, flex_box().width(12.0, Unit::Pixel), cancel },
            vertical_spacer(12.0),
            progress,
            vertical_spacer(10.0),
            status,
            vertical_spacer(6.0),
            detail,
        }
    };
    section
}
