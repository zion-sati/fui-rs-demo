use super::*;

impl ExternalDropDemoState {
    pub(super) fn handle_copy_progress(&self, progress: FileWorkerProcessProgress) {
        self.sync_status(format!(
            "External drop status: worker copying {} / {} bytes to {}...",
            progress.processed_bytes,
            progress.total_bytes,
            output_file_name_label(&progress.output_file_name)
        ));
    }

    pub(super) fn handle_copy_complete(&self, result: FileWorkerProcessResult) {
        self.active_copy_request.borrow_mut().take();
        self.sync_status(format!(
            "External drop status: worker copied {} bytes to {}.{}",
            result.processed_bytes,
            output_file_name_label(&result.output_file_name),
            worker_result_hash_label(&result.worker_result)
        ));
        self.apply_theme(&current_theme());
    }

    pub(super) fn handle_copy_error(&self, message: String) {
        self.active_copy_request.borrow_mut().take();
        self.sync_status(format!(
            "External drop status: worker copy failed • {}",
            message
        ));
        self.apply_theme(&current_theme());
    }

    pub(super) fn start_dropped_file_copy(self: &Rc<Self>) {
        let Some(file) = self.dropped_file.borrow().clone() else {
            self.sync_status("External drop status: drop a file first");
            return;
        };
        if self.active_copy_request.borrow().is_some() {
            self.sync_status("External drop status: worker copy already running");
            return;
        }
        if !File::capabilities().can_process_in_worker_to_picked_file {
            self.sync_status("External drop status: this browser needs worker plus native save-picker support for the worker copy demo");
            return;
        }
        let suggested_name = resolve_copy_file_name(&file);
        let weak_state = Rc::downgrade(self);
        let request = File::process_file_in_worker(file.clone())
            .worker("../advanced-workers.wasm", "advancedFileProcessorWorker")
            .save_to_picked_file(suggested_name.clone())
            .on_progress({
                let weak_state = weak_state.clone();
                move |progress| {
                    if let Some(state) = weak_state.upgrade() {
                        state.handle_copy_progress(progress);
                    }
                }
            })
            .on_complete({
                let weak_state = weak_state.clone();
                move |result| {
                    if let Some(state) = weak_state.upgrade() {
                        state.handle_copy_complete(result);
                    }
                }
            })
            .on_error({
                move |event| {
                    if let Some(state) = weak_state.upgrade() {
                        state.handle_copy_error(event.message);
                    }
                }
            })
            .start();
        self.active_copy_request.replace(Some(request));
        self.sync_status(format!(
            "External drop status: starting worker copy for {} with transfer-list chunk handoff to {}",
            file.name(),
            suggested_name
        ));
        self.apply_theme(&current_theme());
    }
}
