pub(super) const REORDER_DRAG_FORMAT: &str = "application/x-effindom-reorder-item-id";
pub(super) const REORDER_MARKER_HEIGHT_PX: f32 = 8.0;
pub(super) const REORDER_ROW_BODY_HEIGHT_PX: f32 = 72.0;
pub(super) const REORDER_SLOT_HEIGHT_PX: f32 =
    REORDER_MARKER_HEIGHT_PX + REORDER_ROW_BODY_HEIGHT_PX;
pub(super) const REORDER_END_SLOT_HEIGHT_PX: f32 = 44.0;
pub(super) const REORDER_VIEWPORT_HEIGHT_PX: f32 = 248.0;
pub(super) const REORDER_AUTOSCROLL_EDGE_ZONE_PX: f32 = 48.0;
pub(super) const REORDER_AUTOSCROLL_MAX_OUTSIDE_PX: f32 = 120.0;
pub(super) const REORDER_AUTOSCROLL_MIN_STEP_PX: f32 = 4.0;
pub(super) const REORDER_AUTOSCROLL_MAX_STEP_PX: f32 = 34.0;
pub(super) const AUTOSCROLL_DELAY_MS: i32 = 16;
pub(super) const PREVIEW_WIDTH_PX: f32 = 350.0;
pub(super) const PREVIEW_HEIGHT_PX: f32 = 116.0;
pub(super) const PREVIEW_OFFSET_X_PX: f32 = 2.0;
pub(super) const PREVIEW_OFFSET_Y_PX: f32 = 2.0;
pub(super) const PREVIEW_MARGIN_PX: f32 = 12.0;

#[derive(Clone)]
pub(super) struct ReorderDemoItem {
    pub(super) id: &'static str,
    pub(super) label: &'static str,
    pub(super) detail: &'static str,
}

#[derive(Clone, Copy, Default)]
pub(super) struct ReorderVisibleRange {
    pub(super) first_visible_index: i32,
    pub(super) last_visible_index: i32,
}

pub(super) fn create_reorder_demo_items() -> Vec<ReorderDemoItem> {
    vec![
        ReorderDemoItem {
            id: "core-rename",
            label: "Draft project brief",
            detail: "Summarize the goals, constraints, and next decisions for the team.",
        },
        ReorderDemoItem {
            id: "font-cache",
            label: "Review typography samples",
            detail: "Check the headings, body copy, and fallback examples before release.",
        },
        ReorderDemoItem {
            id: "drag-demo",
            label: "Prepare interaction demo",
            detail: "Show item reordering with clear drag feedback and insertion markers.",
        },
        ReorderDemoItem {
            id: "nested-scroll",
            label: "Check nested scrolling",
            detail: "Confirm the list remains easy to use inside the scrolling page.",
        },
        ReorderDemoItem {
            id: "key-router",
            label: "Review keyboard shortcuts",
            detail: "Confirm keyboard interactions remain focused and predictable.",
        },
        ReorderDemoItem {
            id: "semantics",
            label: "Confirm reading order",
            detail: "Make sure status updates follow the same order shown on screen.",
        },
        ReorderDemoItem {
            id: "find-mirror",
            label: "Review page search",
            detail: "Check that visible content remains discoverable as the page moves.",
        },
        ReorderDemoItem {
            id: "drop-cursor",
            label: "Validate drag feedback",
            detail: "Keep pointer feedback clear from pickup through drop or cancellation.",
        },
    ]
}

pub(super) fn find_reorder_item_index(items: &[ReorderDemoItem], item_id: &str) -> i32 {
    items
        .iter()
        .position(|item| item.id == item_id)
        .map(|index| index as i32)
        .unwrap_or(-1)
}

pub(super) fn compute_reorder_content_height(item_count: i32) -> f32 {
    let clamped = item_count.max(0);
    (clamped as f32 * REORDER_SLOT_HEIGHT_PX) + REORDER_END_SLOT_HEIGHT_PX
}

pub(super) fn compute_reorder_visible_range(
    item_count: i32,
    offset_y: f32,
    viewport_height: f32,
) -> ReorderVisibleRange {
    if item_count <= 0 {
        return ReorderVisibleRange {
            first_visible_index: 0,
            last_visible_index: -1,
        };
    }
    let mut first_visible_index = (offset_y / REORDER_SLOT_HEIGHT_PX).floor() as i32;
    first_visible_index = first_visible_index.clamp(0, item_count - 1);
    let effective_viewport_height = if viewport_height > 0.0 {
        viewport_height
    } else {
        REORDER_VIEWPORT_HEIGHT_PX
    };
    let mut last_visible_index =
        ((offset_y + effective_viewport_height - 1.0) / REORDER_SLOT_HEIGHT_PX).floor() as i32;
    if last_visible_index < first_visible_index {
        last_visible_index = first_visible_index;
    }
    if last_visible_index > item_count - 1 {
        last_visible_index = item_count - 1;
    }
    ReorderVisibleRange {
        first_visible_index,
        last_visible_index,
    }
}

pub(super) fn normalize_reorder_insertion_index(
    source_index: i32,
    raw_insertion_index: i32,
    item_count: i32,
) -> i32 {
    if item_count <= 0 {
        return 0;
    }
    let mut clamped = raw_insertion_index.clamp(0, item_count);
    if source_index >= 0 && source_index < item_count && source_index < clamped {
        clamped -= 1;
    }
    clamped.clamp(0, item_count - 1)
}

pub(super) fn move_reorder_item(
    items: &mut Vec<ReorderDemoItem>,
    item_id: &str,
    raw_insertion_index: i32,
) -> bool {
    let source_index = find_reorder_item_index(items, item_id);
    if source_index < 0 || items.len() <= 1 {
        return false;
    }
    let target_index =
        normalize_reorder_insertion_index(source_index, raw_insertion_index, items.len() as i32);
    if target_index == source_index {
        return false;
    }
    let moved = items.remove(source_index as usize);
    items.insert(target_index as usize, moved);
    true
}

pub(super) fn compute_reorder_max_scroll_offset(item_count: i32, viewport_height: f32) -> f32 {
    (compute_reorder_content_height(item_count) - viewport_height).max(0.0)
}

pub(super) fn clamp01(value: f32) -> f32 {
    value.clamp(0.0, 1.0)
}

pub(super) fn compute_reorder_auto_scroll_step(activation_distance: f32) -> f32 {
    if activation_distance <= 0.0 {
        return 0.0;
    }
    let max_activation = REORDER_AUTOSCROLL_EDGE_ZONE_PX + REORDER_AUTOSCROLL_MAX_OUTSIDE_PX;
    let normalized = clamp01(activation_distance / max_activation);
    let eased = normalized * normalized;
    REORDER_AUTOSCROLL_MIN_STEP_PX
        + ((REORDER_AUTOSCROLL_MAX_STEP_PX - REORDER_AUTOSCROLL_MIN_STEP_PX) * eased)
}

pub(super) fn compute_reorder_pointer_auto_scroll_delta(
    pointer_y: f32,
    viewport_top_y: f32,
    viewport_height: f32,
) -> f32 {
    if viewport_height <= 0.0 {
        return 0.0;
    }
    let viewport_bottom_y = viewport_top_y + viewport_height;
    let top_zone_bottom = viewport_top_y + REORDER_AUTOSCROLL_EDGE_ZONE_PX;
    if pointer_y <= top_zone_bottom {
        return -compute_reorder_auto_scroll_step(top_zone_bottom - pointer_y);
    }
    let bottom_zone_top = viewport_bottom_y - REORDER_AUTOSCROLL_EDGE_ZONE_PX;
    if pointer_y >= bottom_zone_top {
        return compute_reorder_auto_scroll_step(pointer_y - bottom_zone_top);
    }
    0.0
}

pub(super) fn compute_next_reorder_auto_scroll_offset(
    current_offset_y: f32,
    delta_y: f32,
    item_count: i32,
    viewport_height: f32,
) -> f32 {
    if delta_y == 0.0 {
        return current_offset_y;
    }
    let max_offset = compute_reorder_max_scroll_offset(item_count, viewport_height);
    (current_offset_y + delta_y).clamp(0.0, max_offset)
}

pub(super) fn compute_reorder_edge_insertion_index(
    direction: i32,
    item_count: i32,
    visible_range: ReorderVisibleRange,
) -> i32 {
    if direction < 0 {
        return visible_range.first_visible_index;
    }
    if direction > 0 {
        let edge = visible_range.last_visible_index + 1;
        return if edge < item_count { edge } else { item_count };
    }
    -1
}
