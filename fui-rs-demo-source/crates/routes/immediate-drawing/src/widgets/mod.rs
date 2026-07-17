mod bar_chart;
mod dancing_yarn;
mod gauge;
mod paint_canvas;
mod pie_chart;
mod scatter_plot;
mod shared;
mod sparkline;
mod waveform;

use bar_chart::BarChart;
use dancing_yarn::DancingYarn;
use fui::prelude::*;
use gauge::Gauge;
use paint_canvas::PaintCanvas;
use pie_chart::PieChart;
use scatter_plot::ScatterPlot;
use sparkline::Sparkline;
use std::cell::Cell;
use std::rc::{Rc, Weak};
use waveform::Waveform;

#[derive(Clone)]
pub struct DrawingGallery {
    root: FlexBox,
    _state: Rc<DemoState>,
}

fui_component!(DrawingGallery => root, owner: _state);

impl DrawingGallery {
    pub fn new() -> Self {
        let theme = current_theme();
        let gauge = Gauge::new(&theme);
        let chart = BarChart::new(&theme);
        let wave = Waveform::new(&theme);
        let spark = Sparkline::new(&theme);
        let pie = PieChart::new(&theme);
        let scatter = ScatterPlot::new(&theme);
        let yarn = DancingYarn::new(&theme);
        let paint_canvas = PaintCanvas::new(&theme);

        let widgets = [
            gauge.node(),
            chart.node(),
            wave.node(),
            spark.node(),
            pie.node(),
            scatter.node(),
            yarn.node(),
            paint_canvas.node(),
        ];
        for (index, widget) in widgets.iter().enumerate() {
            let right = if index + 1 < widgets.len() { 16.0 } else { 0.0 };
            widget.margin(0.0, 0.0, right, 16.0);
        }

        let root = ui! {
            row().fill_width().flex_wrap(FlexWrap::Wrap) {
                gauge.node().clone(),
                chart.node().clone(),
                wave.node().clone(),
                spark.node().clone(),
                pie.node().clone(),
                scatter.node().clone(),
                yarn.node().clone(),
                paint_canvas.node().clone(),
            }
        };
        let state = Rc::new(DemoState {
            gauge_value: Cell::new(0.0),
            gauge_direction: Cell::new(1.0),
            gauge,
            chart,
            wave,
            spark,
            pie,
            scatter,
            yarn,
            _paint_canvas: paint_canvas,
        });
        let weak = Rc::downgrade(&state);
        on_loaded(move |_| schedule_tick(weak));
        Self {
            root,
            _state: state,
        }
    }
}

struct DemoState {
    gauge_value: Cell<f32>,
    gauge_direction: Cell<f32>,
    gauge: Gauge,
    chart: BarChart,
    wave: Waveform,
    spark: Sparkline,
    pie: PieChart,
    scatter: ScatterPlot,
    yarn: DancingYarn,
    _paint_canvas: PaintCanvas,
}

impl DemoState {
    fn tick(&self) {
        let mut value = self.gauge_value.get() + self.gauge_direction.get() * 2.0;
        if value >= 100.0 {
            value = 100.0;
            self.gauge_direction.set(-1.0);
        }
        if value <= 0.0 {
            value = 0.0;
            self.gauge_direction.set(1.0);
        }
        self.gauge_value.set(value);
        self.gauge.set_value(value);
        let a = value;
        let b = (value - 50.0).abs() * 2.0;
        let c = (value / 100.0 * std::f32::consts::PI).sin() * 80.0 + 20.0;
        let d = (value / 100.0 * std::f32::consts::PI * 0.7).cos() * 60.0 + 40.0;
        self.chart.push_values(a, b, c, d);
        self.wave.push_values(a, b, c, d);
        self.spark.push(value);
        self.pie.push_values(
            value,
            b,
            (value / 100.0 * std::f32::consts::PI).sin() * 40.0 + 30.0,
            (value / 100.0 * std::f32::consts::PI * 0.7).cos() * 30.0 + 20.0,
        );
        self.scatter.push_values(
            (value / 100.0 * std::f32::consts::PI * 2.0).sin(),
            (value / 100.0 * std::f32::consts::PI * 2.0).cos(),
            (value / 100.0 * std::f32::consts::PI * 3.0).sin(),
            (value / 100.0 * std::f32::consts::PI * 1.5).sin(),
        );
        self.yarn.tick();
    }
}

fn schedule_tick(state: Weak<DemoState>) {
    set_timeout(25, move || {
        let Some(state) = state.upgrade() else {
            return;
        };
        state.tick();
        schedule_tick(Rc::downgrade(&state));
    });
}
