use fui::bindings::ui;
use fui::prelude::*;
use fui_rs_demo_shared::design_system::{demo_text, section_panel, DemoTextStyle};
use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

mod auto_scroll;
mod drag_state;
mod model;
mod presentation;
mod row_view;
mod state;

use model::*;
use row_view::*;
use state::*;

#[derive(Clone)]
pub(crate) struct ReorderDemoPanel {
    root: FlexBox,
    _state: Rc<RefCell<ReorderDemoState>>,
    _guards: Rc<Vec<Subscription>>,
}

fui_component!(ReorderDemoPanel => root, owners: [_state, _guards]);

impl ReorderDemoPanel {
    pub(crate) fn new() -> Self {
        let panel = ui! {
        section_panel("Drag-and-drop Reorder")
            .fill_width()
            .semantic_label("Drag-and-drop reorder card")
            .clip_to_bounds(false)
        };

        let order_status_text = demo_text("", DemoTextStyle::Body);
        let drag_status_text = demo_text("", DemoTextStyle::Body);
        let viewport_status_text = demo_text("", DemoTextStyle::Body);
        let preview_title_text = demo_text("", DemoTextStyle::Label);
        let preview_detail_text = ui! {
        demo_text("", DemoTextStyle::BodySecondary).text_limits(-1, 2)
        };
        let preview_effect_text = demo_text("", DemoTextStyle::Caption);

        let preview_ghost = ui! {
            flex_box()
            .position_type(PositionType::Absolute)
            .width(PREVIEW_WIDTH_PX, Unit::Pixel)
            .padding(16.0, 14.0, 16.0, 14.0)
            .corner_radius(18.0)
            .child(&ui! {
                row()
                .fill_width()
                .child(&demo_text("☰", DemoTextStyle::Body).selectable(false).width(36.0, Unit::Pixel))
                .child(&flex_box().width(8.0, Unit::Pixel).height(1.0, Unit::Pixel))
                .child(&column().fill_width().child(&preview_title_text).child(&vertical_spacer(4.0)).child(&preview_detail_text))
            })
            .opacity(0.0)
            .visibility(Visibility::Hidden)
            .semantic_role(SemanticRole::StaticText)
            .semantic_label("Reorder drag preview")
        };

        let scroll_content = ui! {
            flex_box()
            .fill_width()
            .flex_direction(FlexDirection::Column)
        };

        let scroll_box = ui! {
            scroll_box()
            .fill_width()
            .height(REORDER_VIEWPORT_HEIGHT_PX, Unit::Pixel)
            .semantic_role(SemanticRole::StaticText)
            .semantic_label("Reorder demo viewport")
            .scroll_enabled_x(false)
            .scroll_enabled_y(true)
            .vertical_scrollbar_visibility(ScrollBarVisibility::Always)
            .horizontal_scrollbar_visibility(ScrollBarVisibility::Never)
            .persist_scroll(false)
            .child(&scroll_content)
        };
        scroll_box
            .vertical_scrollbar()
            .track_width(12.0)
            .thumb_width(8.0)
            .thumb_min_height(36.0)
            .track_corner_radius(6.0)
            .thumb_corner_radius(4.0);

        let end_marker = ui! {
            flex_box()
            .fill_width()
            .height(REORDER_MARKER_HEIGHT_PX, Unit::Pixel)
            .corner_radius(REORDER_MARKER_HEIGHT_PX * 0.5)
            .opacity(0.0)
        };
        let end_drop_zone = ui! {
            flex_box().fill_width().height(44.0, Unit::Pixel)
        };

        let state = Rc::new(RefCell::new(ReorderDemoState {
            root: panel.clone(),
            scroll_box: scroll_box.clone(),
            order_status_text: order_status_text.clone(),
            drag_status_text: drag_status_text.clone(),
            viewport_status_text: viewport_status_text.clone(),
            preview_title_text: preview_title_text.clone(),
            preview_detail_text: preview_detail_text.clone(),
            preview_effect_text: preview_effect_text.clone(),
            preview_ghost: preview_ghost.clone(),
            end_marker: end_marker.clone(),
            end_drop_zone: end_drop_zone.clone(),
            rows: Vec::new(),
            items: RefCell::new(create_reorder_demo_items()),
            active_drag_item_id: RefCell::new(None),
            raw_insertion_index: Cell::new(-1),
            auto_scroll_delta_y: Cell::new(0.0),
            drag_status_message: RefCell::new(String::from("Reorder drag status: idle")),
            preview_pointer_x: Cell::new(f32::NAN),
            preview_pointer_y: Cell::new(f32::NAN),
            ghost_card_width: Cell::new(0.0),
            preview_effect: Cell::new(DragDropEffects::None),
            preview_insertion_slot: Cell::new(-1),
            auto_scroll_timer: RefCell::new(None),
            self_weak: RefCell::new(Weak::new()),
        }));
        *state.borrow().self_weak.borrow_mut() = Rc::downgrade(&state);

        let weak = Rc::downgrade(&state);
        {
            let items = state.borrow().items.borrow().clone();
            let mut rows = Vec::new();
            for (index, item) in items.iter().enumerate() {
                let pending_drag_item_id = Rc::new(RefCell::new(None::<String>));
                let marker = ui! {
                    flex_box()
                    .fill_width()
                    .height(REORDER_MARKER_HEIGHT_PX, Unit::Pixel)
                    .corner_radius(REORDER_MARKER_HEIGHT_PX * 0.5)
                    .opacity(0.0)
                };

                let grip_label = ui! {
                demo_text("☰", DemoTextStyle::BodySecondary).selectable(false).cursor(CursorStyle::Grab)
                };
                grip_label
                    .drag_data({
                        let weak = weak.clone();
                        let pending_drag_item_id = pending_drag_item_id.clone();
                        move || {
                            let state = weak.upgrade()?;
                            let item_id = {
                                let state_ref = state.borrow();
                                let item_id = state_ref
                                    .items
                                    .borrow()
                                    .get(index)
                                    .map(|item| String::from(item.id))?;
                                item_id
                            };
                            pending_drag_item_id.borrow_mut().replace(item_id);
                            let drag_data = state.borrow().begin_drag(index as i32);
                            drag_data
                        }
                    })
                    .drag_allowed_effects(DragDropEffects::Move)
                    .on_drag_completed({
                        let weak = weak.clone();
                        let pending_drag_item_id = pending_drag_item_id.clone();
                        move |event| {
                            if let (Some(state), Some(item_id)) =
                                (weak.upgrade(), pending_drag_item_id.borrow_mut().take())
                            {
                                state.borrow().complete_drag(&item_id, event.effect);
                            }
                        }
                    });

                let grip = ui! {
                    flex_box().width(36.0, Unit::Pixel)
                    .height(40.0, Unit::Pixel)
                    .corner_radius(12.0)
                    .justify_content(JustifyContent::Center)
                    .align_items(AlignItems::Center)
                    .cursor(CursorStyle::Grab)
                    .semantic_role(SemanticRole::Button)
                    .semantic_label("Drag grip")
                    .drag_data({
                        let weak = weak.clone();
                        let pending_drag_item_id = pending_drag_item_id.clone();
                        move || {
                            let state = weak.upgrade()?;
                            let item_id = {
                                let state_ref = state.borrow();
                                let item_id = state_ref
                                    .items
                                    .borrow()
                                    .get(index)
                                    .map(|item| String::from(item.id))?;
                                item_id
                            };
                            pending_drag_item_id.borrow_mut().replace(item_id);
                            let drag_data = state.borrow().begin_drag(index as i32);
                            drag_data
                        }
                    })
                    .drag_allowed_effects(DragDropEffects::Move)
                    .on_drag_completed({
                        let weak = weak.clone();
                        let pending_drag_item_id = pending_drag_item_id.clone();
                        move |event| {
                            if let (Some(state), Some(item_id)) =
                                (weak.upgrade(), pending_drag_item_id.borrow_mut().take())
                            {
                                state.borrow().complete_drag(&item_id, event.effect);
                            }
                        }
                    })
                    .child(&grip_label)
                };

                let title_text = demo_text("", DemoTextStyle::Label);
                let detail_text = ui! {
                demo_text("", DemoTextStyle::BodySecondary).text_limits(-1, 2)
                };
                let card = ui! {
                    flex_box().fill_width()
                    .height(REORDER_ROW_BODY_HEIGHT_PX, Unit::Pixel)
                    .padding(16.0, 14.0, 16.0, 14.0)
                    .corner_radius(18.0)
                    .child(&ui! {
                        row()
                        .fill_width()
                        .child(&grip)
                        .child(&ui! { flex_box().width(8.0, Unit::Pixel).height(1.0, Unit::Pixel) })
                        .child(&ui! {
                            column()
                                .fill_width()
                                .child(&title_text)
                                .child(&vertical_spacer(4.0))
                                .child(&detail_text)
                        })
                    })
                };
                let slot = ui! {
                    flex_box().fill_width()
                    .flex_direction(FlexDirection::Column)
                    .allow_drop(true)
                    .on_drag_enter({
                        let weak = weak.clone();
                        move |args| {
                            weak.upgrade()
                                .map(|state| state.borrow().preview_insertion(args, index as i32))
                                .unwrap_or_else(DropProposal::none)
                        }
                    })
                    .on_drag_over({
                        let weak = weak.clone();
                        move |args| {
                            weak.upgrade()
                                .map(|state| state.borrow().preview_insertion(args, index as i32))
                                .unwrap_or_else(DropProposal::none)
                        }
                    })
                    .on_drag_leave({
                        let weak = weak.clone();
                        move |args| {
                            if let Some(state) = weak.upgrade() {
                                state.borrow().handle_target_leave(args);
                            }
                        }
                    })
                    .on_drop({
                        let weak = weak.clone();
                        move |args| {
                            if let Some(state) = weak.upgrade() {
                                state.borrow().drop_at_preview(args);
                            }
                        }
                    })
                    .child(&marker)
                    .child(&card)
                };
                let row = ReorderRowView {
                    raw_index: index as i32,
                    marker,
                    grip_label,
                    grip,
                    title_text,
                    detail_text,
                    card,
                    slot,
                };
                row.bind_item(item);
                scroll_content.child(&row.slot);
                rows.push(row);
            }
            state.borrow_mut().rows = rows;
        }

        end_drop_zone
            .allow_drop(true)
            .on_drag_enter({
                let weak = weak.clone();
                move |args| {
                    weak.upgrade()
                        .map(|state| state.borrow().handle_end_drag_over(args))
                        .unwrap_or_else(DropProposal::none)
                }
            })
            .on_drag_over({
                let weak = weak.clone();
                move |args| {
                    weak.upgrade()
                        .map(|state| state.borrow().handle_end_drag_over(args))
                        .unwrap_or_else(DropProposal::none)
                }
            })
            .on_drag_leave({
                let weak = weak.clone();
                move |args| {
                    if let Some(state) = weak.upgrade() {
                        state.borrow().handle_target_leave(args);
                    }
                }
            })
            .on_drop({
                let weak = weak.clone();
                move |args| {
                    if let Some(state) = weak.upgrade() {
                        state.borrow().drop_at_preview(args);
                    }
                }
            })
            .child(&end_marker)
            .child(&ui! {
                flex_box()
                .fill_width()
                .height(36.0, Unit::Pixel)
                .corner_radius(14.0)
                .justify_content(JustifyContent::Center)
                .align_items(AlignItems::Center)
                .child(&demo_text("Drop at end of reorder list", DemoTextStyle::BodySecondary))
            });

        scroll_content.child(&end_drop_zone);
        scroll_box.scroll_content_size(
            -1.0,
            compute_reorder_content_height(state.borrow().items.borrow().len() as i32),
        );

        scroll_box.width(600.0, Unit::Pixel);
        panel
            .child(&scroll_box)
            .child(&vertical_spacer(12.0))
            .child(&order_status_text)
            .child(&vertical_spacer(6.0))
            .child(&drag_status_text)
            .child(&vertical_spacer(6.0))
            .child(&viewport_status_text)
            .child(&vertical_spacer(10.0))
            .child(&demo_text(
                "Drag a grip with a mouse, or touch and hold before moving. Release to drop. The grip highlights the source row and drop indicators mark the insertion point.",
                DemoTextStyle::Body,
            ))
            .child(&ui! {
            portal()
                .position_type(PositionType::Absolute)
                .position(0.0, 0.0)
                .fill_size()
                .child(&preview_ghost)
            });

        panel.bind_theme({
            let state = Rc::downgrade(&state);
            move |_panel, theme| {
                if let Some(state) = state.upgrade() {
                    state.borrow().apply_theme(theme);
                }
            }
        });
        let guards = vec![
            scroll_box.scroll_state().subscribe_offset_y({
                let state = Rc::downgrade(&state);
                move || {
                    if let Some(state) = state.upgrade() {
                        state.borrow().sync_viewport_status();
                    }
                }
            }),
            scroll_box.scroll_state().subscribe_viewport_height({
                let state = Rc::downgrade(&state);
                move || {
                    if let Some(state) = state.upgrade() {
                        state.borrow().sync_viewport_status();
                    }
                }
            }),
        ];

        state.borrow().sync_all();

        Self {
            root: panel,
            _state: state,
            _guards: Rc::new(guards),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        compute_next_reorder_auto_scroll_offset, compute_reorder_content_height,
        compute_reorder_edge_insertion_index, compute_reorder_pointer_auto_scroll_delta,
        compute_reorder_visible_range, create_reorder_demo_items, move_reorder_item,
        normalize_reorder_insertion_index, ReorderDemoPanel, ReorderVisibleRange,
        REORDER_END_SLOT_HEIGHT_PX, REORDER_SLOT_HEIGHT_PX,
    };
    use std::rc::Rc;

    #[test]
    fn reorder_content_height_matches_fui_as_formula() {
        assert_eq!(
            compute_reorder_content_height(3),
            (3.0 * REORDER_SLOT_HEIGHT_PX) + REORDER_END_SLOT_HEIGHT_PX
        );
    }

    #[test]
    fn normalize_reorder_insertion_index_matches_fui_as_adjustment() {
        assert_eq!(normalize_reorder_insertion_index(1, 4, 5), 3);
        assert_eq!(normalize_reorder_insertion_index(3, 1, 5), 1);
    }

    #[test]
    fn move_reorder_item_reorders_retained_list() {
        let mut items = create_reorder_demo_items();
        assert!(move_reorder_item(&mut items, "drag-demo", 0));
        assert_eq!(items[0].id, "drag-demo");
    }

    #[test]
    fn move_reorder_item_rejects_missing_and_no_op_moves() {
        let mut items = create_reorder_demo_items();
        assert!(!move_reorder_item(&mut items, "missing", 2));
        let first_item_id = items[0].id;
        assert!(!move_reorder_item(&mut items, first_item_id, 1));
    }

    #[test]
    fn pointer_auto_scroll_activates_only_near_viewport_edges() {
        assert!(compute_reorder_pointer_auto_scroll_delta(105.0, 100.0, 240.0) < 0.0);
        assert_eq!(
            compute_reorder_pointer_auto_scroll_delta(220.0, 100.0, 240.0),
            0.0
        );
        assert!(compute_reorder_pointer_auto_scroll_delta(335.0, 100.0, 240.0) > 0.0);
    }

    #[test]
    fn auto_scroll_offset_clamps_to_retained_content_bounds() {
        assert_eq!(
            compute_next_reorder_auto_scroll_offset(0.0, -20.0, 8, 240.0),
            0.0
        );
        let maximum = compute_reorder_content_height(8) - 240.0;
        assert_eq!(
            compute_next_reorder_auto_scroll_offset(maximum, 20.0, 8, 240.0),
            maximum
        );
    }

    #[test]
    fn edge_insertion_uses_visible_range_boundaries() {
        let range = ReorderVisibleRange {
            first_visible_index: 2,
            last_visible_index: 4,
        };
        assert_eq!(compute_reorder_edge_insertion_index(-1, 8, range), 2);
        assert_eq!(compute_reorder_edge_insertion_index(1, 8, range), 5);
        assert_eq!(compute_reorder_edge_insertion_index(0, 8, range), -1);
    }

    #[test]
    fn visible_range_clamps_to_item_bounds() {
        let range = compute_reorder_visible_range(8, 9999.0, 100.0);
        assert_eq!(range.first_visible_index, 7);
        assert_eq!(range.last_visible_index, 7);
    }

    #[test]
    fn dropping_panel_releases_reorder_state_and_owned_subscriptions() {
        let panel = ReorderDemoPanel::new();
        let state = Rc::downgrade(&panel._state);
        drop(panel);
        assert!(state.upgrade().is_none());
    }
}
