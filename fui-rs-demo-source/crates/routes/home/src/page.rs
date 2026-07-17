use super::*;

fn debug_shortcut_label() -> &'static str {
    match platform::platform_family() {
        platform::PlatformFamily::Apple => "Cmd+Shift+F12",
        platform::PlatformFamily::Windows => "Win+Shift+F12",
        platform::PlatformFamily::Linux => "Super+Shift+F12",
        platform::PlatformFamily::Unknown => "Meta+Shift+F12",
    }
}

fn accessibility_description() -> RichText {
    let description = RichText::new(vec![
        span("Use keyboard Tab to navigate through the controls and inspect the semantic tree to explore accessibility features - FUI-RS is fully ARIA compliant out of the box. Press "),
        span(debug_shortcut_label()).bold(),
        span(" to open the debug dialog when on-requested developer tools are enabled; apps can enable or disable this surface through runtime configuration."),
    ]);
    description
        .font_size(14.0)
        .fill_width()
        .bind_theme(|text, theme| {
            text.text_color(theme.colors.text_muted);
        });
    description
}

impl HomePage {
    pub(super) fn new() -> Self {
        use_system_theme();
        let dropdown_items = vec![
            DropdownItem::new("tiny", "Tiny"),
            DropdownItem::new("small", "Small"),
            DropdownItem::new("medium", "Medium"),
            DropdownItem::new("large", "Large"),
            DropdownItem::new("xlarge", "Extra large"),
        ];
        let dropdown = ui! { demo_dropdown().items(dropdown_items.clone()).select_index(2) };
        let tri_state_checkbox = ui! {
            demo_checkbox("Tri-state checkbox").tri_state(true).mixed(true)
        };
        let bi_state_checkbox = ui! { demo_checkbox("Bi-state checkbox").check(true) };
        let quality_radio_group = ui! {
            radio_group()
            .add_radio(demo_radio("balanced", "Balanced"))
            .add_radio(demo_radio("quality", "Quality first"))
            .add_radio(demo_radio("speed", "Speed first"))
            .select_index(0)
        };
        let horizontal_slider = ui! {
            demo_slider(40.0)
            .min(0.0)
            .max(100.0)
            .step(5.0)
            .length(300.0)
        };
        let vertical_slider = ui! {
            demo_slider(65.0)
            .min(0.0)
            .max(100.0)
            .step(5.0)
            .length(150.0)
            .orientation(Orientation::Vertical)
        };
        let elapsed_text = demo_text("Time since app started: 00:00:00", DemoTextStyle::Lead);
        let summary_text = demo_text(
            "Selections: waiting for interaction.",
            DemoTextStyle::BodySecondary,
        );
        let action_button = primary_button("Open dialog form");
        let dialog = ui! {
            Dialog::new("Demo dialog form", "No selection captured yet.").appearance(
                DialogAppearance::new().card(SurfaceAppearance::new().corners(Corners::all(16.0))),
            )
        };
        dialog.accept_action_button().text("Apply");
        dialog.cancel_action_button().text("Cancel");

        let foundations_toggle_button = primary_button("Disable scoped child");
        let foundations_scoped_button = primary_button("Scoped child action");
        let foundations_status_text = demo_text("", DemoTextStyle::BodySecondary);
        let foundations_focus_text = demo_text("", DemoTextStyle::BodySecondary);
        let foundations_action_text = demo_text("", DemoTextStyle::BodySecondary);
        let foundations_key_target_text = ui! {
            demo_text("", DemoTextStyle::Body).selectable(false)
        };
        let foundations_key_target_box = ui! {
            flex_box()
            .width(280.0, Unit::Pixel)
            .padding(12.0, 10.0, 12.0, 10.0)
            .corner_radius(12.0)
            .node_id("demo-key-target")
            .focusable(true, 0) {
                foundations_key_target_text,
        }};
        let foundations_scope_box = ui! {
            panel().width(0.0, Unit::Auto) {
                demo_text(
                    "This child button inherits enabled/disabled from its parent scope.",
                    DemoTextStyle::BodySecondary,
                ),
                vertical_spacer(10.0),
                foundations_scoped_button,
                vertical_spacer(8.0),
                foundations_focus_text,
                vertical_spacer(8.0),
                foundations_action_text,
        }};

        let controls_surface = ui! { panel().width(0.0, Unit::Auto) {
            demo_text("Common Controls", DemoTextStyle::Heading3),
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            accessibility_description(),
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            demo_text("Dropdown", DemoTextStyle::Label),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            dropdown,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            demo_text("Checkboxes", DemoTextStyle::Label),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            tri_state_checkbox,
            vertical_spacer(MICRO_STACK_GAP_PX),
            bi_state_checkbox,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            demo_text("Radio group", DemoTextStyle::Label),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            quality_radio_group,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            demo_text("Sliders", DemoTextStyle::Label),
            vertical_spacer(LABEL_TO_CONTROL_GAP_PX),
            row().align_items(AlignItems::Stretch) {
                column() {
                    demo_text("Horizontal", DemoTextStyle::BodySecondary),
                    vertical_spacer(MICRO_STACK_GAP_PX),
                    horizontal_slider,
                },
                horizontal_spacer(16.0),
                column() {
                    demo_text("Vertical", DemoTextStyle::BodySecondary),
                    vertical_spacer(MICRO_STACK_GAP_PX),
                    vertical_slider,
                },
            },
            vertical_spacer(PAGE_SECTION_GAP_PX),
        }};

        let control_foundations = ui! { panel().width(0.0, Unit::Auto) {
            demo_text("Control foundations", DemoTextStyle::Heading3),
            vertical_spacer(HEADING_TO_BODY_TIGHT_GAP_PX),
            demo_text("Tab onto these buttons to see the focus ring. Use the outer toggle to disable the parent scope and watch the child button dim and stop activating.", DemoTextStyle::BodySecondary),
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            foundations_status_text,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            foundations_toggle_button,
            vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
            foundations_scope_box,
            vertical_spacer(PANEL_SECTION_GAP_PX),
            demo_text("Keyboard focus target", DemoTextStyle::Label),
            vertical_spacer(HEADING_TO_BODY_TIGHT_GAP_PX),
            demo_text("Tab onto this box, then press keys to verify retained focus and key routing.", DemoTextStyle::BodySecondary),
            vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
            foundations_key_target_box,
        }};

        let bitmap = create_custom_bitmap();
        let controls_scroll = demo_scroll_box("ControlsScrollBox");
        controls_scroll.fill_size().children(children![
            controls_surface,
            vertical_spacer(PANEL_SECTION_GAP_PX),
            create_controls_images_panel(&bitmap),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            create_nested_scroll_panel(),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            control_foundations,
        ]);

        let virtual_list_panel = ui! {
            panel().width(250.0, Unit::Pixel).fill_height() {
                demo_text("Virtual List", DemoTextStyle::Heading2),
                vertical_spacer(HEADING_TO_BODY_GAP_PX),
                demo_text(
                    "This list contains 100,000 items. Scroll to see more.",
                    DemoTextStyle::BodySecondary
                ),
                vertical_spacer(HEADING_TO_BODY_GAP_PX),
                create_virtual_list(),
        }};
        let main_panel = ui! { panel().fill_size() {
            demo_text("Basic controls showcase", DemoTextStyle::Heading2),
            vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
            demo_text(
                "Demo controls are wrapped by route design-system components.",
                DemoTextStyle::BodySecondary
            ),
            vertical_spacer(HEADING_TO_BODY_TIGHT_GAP_PX),
            NavLink::with_label(
                "https://github.com/zion-sati/fui-rs-demo",
                "View the FUI-RS demo source code on GitHub",
            ),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            elapsed_text,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            action_button,
            vertical_spacer(HEADING_TO_BODY_GAP_PX),
            summary_text,
            vertical_spacer(PANEL_SECTION_GAP_PX),
            controls_scroll,
        }};
        let content = ui! {
            column()
            .min_width(800.0, Unit::Pixel)
            .min_height(600.0, Unit::Pixel)
            .fill_size()
            .padding(24.0, 24.0, 24.0, 24.0) {
                create_nav_bar("Home Page - FUI-RS Demo ✌🏼", "home"),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                row()
                    .align_items(AlignItems::Stretch)
                    .fill_height() {
                        virtual_list_panel,
                        horizontal_spacer(24.0),
                        main_panel,
                },
        }};
        let root = ui! {
            selection_area()
            .fill_size()
            .bind_theme(|root, theme| {
                root.bg_color(theme.colors.background);
            }) {
                flex_box().fill_size() {
                    demo_scroll_box("mainScrollBox").fill_size() {
                        content,
                    },
                    dialog,
                },
        }};

        let state = Rc::new(HomeState {
            root: root.clone(),
            dialog,
            dropdown,
            dropdown_items,
            tri_state_checkbox,
            bi_state_checkbox,
            quality_radio_group,
            horizontal_slider,
            vertical_slider,
            elapsed_text,
            summary_text,
            foundations_toggle_button,
            foundations_scoped_button,
            foundations_key_target_box,
            foundations_key_target_text,
            foundations_status_text,
            foundations_focus_text,
            foundations_action_text,
            foundations_scope_box,
            foundations_scope_enabled: Cell::new(true),
            foundations_scoped_focused: Cell::new(false),
            foundations_action_count: Cell::new(0),
            foundations_key_target_focused: Cell::new(false),
            foundations_last_key: RefCell::new(String::new()),
            start_tick: Cell::new(-1),
            host_event_subscriptions: RefCell::new(Vec::new()),
            _bitmap: bitmap,
        });
        wire_events(&state, &action_button);
        state.refresh_foundations_state();
        state.refresh_key_target();
        state.refresh_summary();
        Self {
            root,
            _state: state,
        }
    }
}

fn wire_events(state: &Rc<HomeState>, action_button: &Button) {
    action_button.on_click({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.show_dialog();
            }
        }
    });
    state.dialog.on_accept({
        let state = Rc::downgrade(state);
        move || {
            if let Some(state) = state.upgrade() {
                state.summary_text.text("Dialog accepted.");
            }
        }
    });
    state.dialog.on_cancel({
        let state = Rc::downgrade(state);
        move || {
            if let Some(state) = state.upgrade() {
                state.summary_text.text("Dialog cancelled.");
            }
        }
    });
    state.dropdown.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.tri_state_checkbox.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.bi_state_checkbox.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.quality_radio_group.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.horizontal_slider.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.vertical_slider.on_changed({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.refresh_summary();
            }
        }
    });
    state.foundations_toggle_button.on_click({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.toggle_foundations_scope();
            }
        }
    });
    state.foundations_scoped_button.on_click({
        let state = Rc::downgrade(state);
        move |_| {
            if let Some(state) = state.upgrade() {
                state.record_foundations_action();
            }
        }
    });
    state.foundations_scoped_button.on_focus_changed({
        let state = Rc::downgrade(state);
        move |event| {
            if let Some(state) = state.upgrade() {
                state
                    .foundations_scoped_focused
                    .set(event.focused && state.foundations_scope_enabled.get());
                state.refresh_foundations_state();
            }
        }
    });
    state.foundations_key_target_box.on_focus_changed({
        let state = Rc::downgrade(state);
        move |event| {
            if let Some(state) = state.upgrade() {
                state.foundations_key_target_focused.set(event.focused);
                state.refresh_key_target();
            }
        }
    });
    state.foundations_key_target_box.on_key_down({
        let state = Rc::downgrade(state);
        move |event| {
            if let Some(state) = state.upgrade() {
                state.foundations_last_key.replace(event.key.clone());
                state.refresh_key_target();
            }
        }
    });
    state.root.bind_theme({
        let state = Rc::downgrade(state);
        move |_, _| {
            if let Some(state) = state.upgrade() {
                state.refresh_key_target();
            }
        }
    });
    let subscription = generated::host_events::on_app_clock_tick({
        let state = Rc::downgrade(state);
        move |tick| {
            if let Some(state) = state.upgrade() {
                state.set_elapsed_seconds(tick);
            }
        }
    });
    state
        .host_event_subscriptions
        .borrow_mut()
        .push(subscription);
}
