use std::any::Any;
use std::rc::Rc;

type ClockCallback = Rc<dyn Fn(u64)>;
type ClockSubscriber = dyn Fn(ClockCallback) -> AppClockSubscription;

#[derive(Clone)]
pub struct AppClock {
    subscribe: Rc<ClockSubscriber>,
}

impl AppClock {
    pub fn new(subscribe: impl Fn(ClockCallback) -> AppClockSubscription + 'static) -> Self {
        Self {
            subscribe: Rc::new(subscribe),
        }
    }

    #[must_use = "retain the clock subscription while updates are required"]
    pub fn subscribe(&self, callback: impl Fn(u64) + 'static) -> AppClockSubscription {
        (self.subscribe)(Rc::new(callback))
    }
}

pub struct AppClockSubscription {
    _guard: Box<dyn Any>,
}

impl AppClockSubscription {
    pub fn retain(guard: impl Any) -> Self {
        Self {
            _guard: Box::new(guard),
        }
    }
}

#[derive(Clone)]
pub struct DemoServices {
    pub clock: AppClock,
}

impl DemoServices {
    pub fn new(clock: AppClock) -> Self {
        Self { clock }
    }
}
