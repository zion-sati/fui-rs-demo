use super::*;
pub(super) fn policy_group(options: &[(&str, &str)]) -> RadioGroup {
    let group = radio_group();
    for (value, label) in options {
        group.add_option(*value, *label);
    }
    group.select_index(0);
    group
}

pub(super) fn on_off(value: bool) -> &'static str {
    if value {
        "on"
    } else {
        "off"
    }
}

pub(super) fn wire_events(
    state: &Rc<TextFontsState>,
    username: &TextInput,
    password: &TextInput,
    sign_in: &Button,
    clear: &Button,
    sign_in_status: &TextNode,
) {
    sign_in.on_click({
        let status = sign_in_status.clone();
        move |_| {
            status.text("Sign-in submitted locally. No credentials were transmitted.");
        }
    });
    clear.on_click({
        let username = username.clone();
        let password = password.clone();
        let status = sign_in_status.clone();
        move |_| {
            username.text("");
            password.text("");
            status.text("Login fields cleared locally.");
        }
    });
    state.read_only_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            state.text_area.read_only(event.checked);
            state.sync_status();
        },
    ));
    state.wrapping_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            state.text_area.wrapping(event.checked);
            if event.checked {
                state.horizontal_policy_group.select_index(0);
                state.apply_horizontal_policy();
            }
            state.sync_status();
        },
    ));
    state.text_area.on_focus_changed(weak_handler(
        state,
        |state, event: FocusChangedEventArgs| {
            state.focused.set(event.focused);
            state.sync_status();
        },
    ));
    state.text_area.on_selection_changed(weak_handler(
        state,
        |state, _: SelectionChangedEventArgs| state.sync_status(),
    ));
    state
        .text_area
        .on_changed(weak_handler(state, |state, _: TextChangedEventArgs| {
            state.sync_status()
        }));
    state.vertical_policy_group.on_changed(weak_handler(
        state,
        |state, _: RadioGroupChangedEventArgs| state.apply_vertical_policy(),
    ));
    state.horizontal_policy_group.on_changed(weak_handler(
        state,
        |state, _: RadioGroupChangedEventArgs| state.apply_horizontal_policy(),
    ));
    state.line_height_group.on_changed(weak_handler(
        state,
        |state, _: RadioGroupChangedEventArgs| {
            state.text_area.line_height(
                if state.line_height_group.selected_value() == "fixed-28" {
                    FIXED_LINE_HEIGHT_PX
                } else {
                    0.0
                },
            );
            state.sync_status();
        },
    ));
    state.font_mode_group.on_changed(weak_handler(
        state,
        |state, _: RadioGroupChangedEventArgs| state.apply_font_mode(),
    ));
    state.visibility_dropdown.on_changed(weak_handler(
        state,
        |state, _: DropdownChangedEventArgs<DropdownItem>| {
            state
                .text_area
                .visibility(match state.visibility_dropdown.selected_index() {
                    1 => Visibility::Hidden,
                    2 => Visibility::Collapsed,
                    _ => Visibility::Normal,
                });
            state.sync_status();
        },
    ));
    state.always_vertical_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            if state.syncing_vertical.get() {
                return;
            }
            state
                .vertical_policy_group
                .select_index(if event.checked { 1 } else { 0 });
            state.apply_vertical_policy();
        },
    ));
    state.never_vertical_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            if state.syncing_vertical.get() {
                return;
            }
            state
                .vertical_policy_group
                .select_index(if event.checked { 2 } else { 0 });
            state.apply_vertical_policy();
        },
    ));
    state.always_horizontal_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            if state.syncing_horizontal.get() {
                return;
            }
            state
                .horizontal_policy_group
                .select_index(if event.checked { 1 } else { 0 });
            state.apply_horizontal_policy();
        },
    ));
    state.never_horizontal_toggle.on_changed(weak_handler(
        state,
        |state, event: CheckboxChangedEventArgs| {
            if state.syncing_horizontal.get() {
                return;
            }
            state
                .horizontal_policy_group
                .select_index(if event.checked { 2 } else { 0 });
            state.apply_horizontal_policy();
        },
    ));
}

pub(super) fn weak_handler<E: 'static>(
    state: &Rc<TextFontsState>,
    handler: impl Fn(&TextFontsState, E) + 'static,
) -> impl Fn(E) + 'static {
    let weak = Rc::downgrade(state);
    move |event| {
        if let Some(state) = weak.upgrade() {
            handler(&state, event);
        }
    }
}
