//! Native-only services belong here so the retained UI remains target-independent.

use fui::prelude::set_timeout;
use fui_rs_demo_shared::app_services::{
    AppClock, AppClockSubscription, DemoServices,
};
use std::cell::Cell;
use std::rc::{Rc, Weak};
use std::time::Instant;

struct NativeClockState {
    active: Cell<bool>,
    started_at: Instant,
    callback: Rc<dyn Fn(u64)>,
}

struct NativeClockGuard {
    state: Rc<NativeClockState>,
}

impl Drop for NativeClockGuard {
    fn drop(&mut self) {
        self.state.active.set(false);
    }
}

fn schedule_tick(state: Weak<NativeClockState>) {
    set_timeout(250, move || {
        let Some(state) = state.upgrade() else {
            return;
        };
        if !state.active.get() {
            return;
        }
        (state.callback)(state.started_at.elapsed().as_secs());
        schedule_tick(Rc::downgrade(&state));
    });
}

pub fn create_app_services() -> DemoServices {
    DemoServices::new(AppClock::new(|callback| {
        callback(0);
        let state = Rc::new(NativeClockState {
            active: Cell::new(true),
            started_at: Instant::now(),
            callback,
        });
        schedule_tick(Rc::downgrade(&state));
        AppClockSubscription::retain(NativeClockGuard { state })
    }))
}
