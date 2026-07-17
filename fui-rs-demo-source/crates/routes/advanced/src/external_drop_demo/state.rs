use super::*;
pub(super) struct ExternalDropDemoElements {
    pub(super) drop_target: FlexBox,
    pub(super) drop_title_text: TextNode,
    pub(super) drop_body_text: TextNode,
    pub(super) status_text: TextNode,
    pub(super) items_text: TextNode,
    pub(super) capability_text: TextNode,
    pub(super) hint_text: TextNode,
    pub(super) copy_button: Button,
}

pub(super) struct ExternalDropDemoState {
    drop_target: FlexBox,
    drop_title_text: TextNode,
    drop_body_text: TextNode,
    status_text: TextNode,
    items_text: TextNode,
    capability_text: TextNode,
    hint_text: TextNode,
    copy_button: Button,
    last_items: RefCell<Vec<ExternalDropItemInfo>>,
    hovering_accepted: Cell<bool>,
    ignore_next_leave: Cell<bool>,
    pub(super) dropped_file: RefCell<Option<BrowserFile>>,
    pub(super) active_copy_request: RefCell<Option<FileWorkerProcessRequest>>,
}

impl ExternalDropDemoState {
    pub(super) fn new(elements: ExternalDropDemoElements) -> Self {
        let ExternalDropDemoElements {
            drop_target,
            drop_title_text,
            drop_body_text,
            status_text,
            items_text,
            capability_text,
            hint_text,
            copy_button,
        } = elements;
        Self {
            drop_target,
            drop_title_text,
            drop_body_text,
            status_text,
            items_text,
            capability_text,
            hint_text,
            copy_button,
            last_items: RefCell::new(Vec::new()),
            hovering_accepted: Cell::new(false),
            ignore_next_leave: Cell::new(false),
            dropped_file: RefCell::new(None),
            active_copy_request: RefCell::new(None),
        }
    }

    pub(super) fn can_copy_dropped_file(&self) -> bool {
        self.dropped_file.borrow().is_some()
            && self.active_copy_request.borrow().is_none()
            && File::capabilities().can_process_in_worker_to_picked_file
    }

    pub(super) fn sync_status(&self, label: impl Into<String>) {
        let label = label.into();
        self.status_text.text(&label);
        self.status_text.semantic_label(label);
    }

    pub(super) fn sync_items(&self) {
        let items = self.last_items.borrow();
        let label = if items.is_empty() {
            "External drop items: none".to_string()
        } else {
            format!(
                "External drop items: {}",
                items
                    .iter()
                    .map(describe_item)
                    .collect::<Vec<_>>()
                    .join(" | ")
            )
        };
        self.items_text.text(&label);
        self.items_text.semantic_label(label);
    }

    pub(super) fn sync_capabilities(&self) {
        let capabilities = File::capabilities();
        let label = format!(
            "File capabilities: open={} • chunk-read={} • save={} • native-save-picker={} • worker-process-save={}",
            if capabilities.can_pick_open { "yes" } else { "no" },
            if capabilities.can_read_chunks { "yes" } else { "no" },
            if capabilities.can_save { "yes" } else { "no" },
            if capabilities.can_use_native_save_picker { "yes" } else { "no" },
            if capabilities.can_process_in_worker_to_picked_file { "yes" } else { "no" },
        );
        self.capability_text.text(&label);
        self.capability_text.semantic_label(label);
    }

    pub(super) fn apply_theme(&self, theme: &Theme) {
        let hovering = self.hovering_accepted.get();
        self.drop_target
            .bg_color(if hovering {
                theme.colors.accent_hovered
            } else if is_dark_mode() {
                rgb(0x11, 0x1c, 0x2c)
            } else {
                rgb(0xf8, 0xfa, 0xfc)
            })
            .border(
                1.0,
                if hovering {
                    theme.colors.accent
                } else {
                    theme.colors.border
                },
            );
        self.drop_title_text.text_color(if hovering {
            theme.colors.surface
        } else {
            theme.colors.text_primary
        });
        self.drop_body_text.text_color(if hovering {
            theme.colors.surface
        } else {
            theme.colors.text_muted
        });
        let can_copy = self.can_copy_dropped_file();
        self.copy_button
            .enabled(can_copy)
            .bg_color(if can_copy {
                if is_dark_mode() {
                    rgb(0x11, 0x1c, 0x2c)
                } else {
                    rgb(0xf8, 0xfa, 0xfc)
                }
            } else {
                theme.colors.surface
            })
            .border(1.0, theme.colors.border)
            .text_color(if can_copy {
                theme.colors.text_primary
            } else {
                theme.colors.text_muted
            });
        self.status_text.text_color(theme.colors.text_primary);
        self.items_text.text_color(theme.colors.text_muted);
        self.capability_text.text_color(theme.colors.text_muted);
        self.hint_text.text_color(theme.colors.text_muted);
    }

    pub(super) fn replace_items(&self, items: Vec<ExternalDropItemInfo>) {
        self.last_items.replace(items);
        self.sync_items();
    }

    pub(super) fn handle_external_drag(&self, args: ExternalDropEventArgs) -> DropProposal {
        self.ignore_next_leave.replace(false);
        self.replace_items(args.items.clone());
        if args.items.is_empty() {
            self.hovering_accepted.replace(false);
            self.sync_status("External drop status: ignoring non-file drag");
            self.apply_theme(&current_theme());
            return DropProposal::none();
        }
        self.hovering_accepted.replace(true);
        self.sync_status(format!(
            "External drop status: hovering {} • effect Copy",
            format_item_count(args.items.len())
        ));
        self.apply_theme(&current_theme());
        DropProposal::new(DragDropEffects::Copy, false)
    }

    pub(super) fn handle_external_leave(&self, _args: ExternalDropEventArgs) {
        if self.ignore_next_leave.get() {
            self.ignore_next_leave.replace(false);
            return;
        }
        self.hovering_accepted.replace(false);
        if self.last_items.borrow().is_empty() {
            self.sync_status("External drop status: idle");
        } else {
            self.sync_status("External drop status: ready for another drop");
        }
        self.apply_theme(&current_theme());
    }

    pub(super) fn handle_external_drop(&self, args: ExternalDropEventArgs) {
        self.hovering_accepted.replace(false);
        self.ignore_next_leave.replace(true);
        self.replace_items(args.items.clone());
        self.dropped_file
            .replace(args.items.iter().find_map(|item| item.file.clone()));
        self.sync_status(format!(
            "External drop status: dropped {} • effect Copy",
            format_item_count(args.items.len())
        ));
        self.apply_theme(&current_theme());
    }
}
