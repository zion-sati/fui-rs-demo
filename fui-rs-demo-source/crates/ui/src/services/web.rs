//! Browser-only services belong here so the retained UI remains target-independent.

use fui_rs_demo_shared::app_services::{
    AppClock, AppClockSubscription, DemoServices,
};
use std::cell::Cell;
use std::rc::Rc;

pub fn create_app_services() -> DemoServices {
    DemoServices::new(AppClock::new(|callback| {
        let started_at = Rc::new(Cell::new(None));
        let subscription =
            fui_rs_demo_shared::generated::host_events::on_app_clock_tick(move |tick| {
                let started = started_at.get().unwrap_or_else(|| {
                    started_at.set(Some(tick));
                    tick
                });
                callback((tick - started).max(0) as u64);
            });
        AppClockSubscription::retain(subscription)
    }))
}
