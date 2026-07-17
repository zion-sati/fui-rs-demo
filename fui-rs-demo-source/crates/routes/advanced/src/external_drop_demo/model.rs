use super::*;
pub(super) fn format_item_count(count: usize) -> String {
    match count {
        1 => "1 file".to_string(),
        _ => format!("{} files", count),
    }
}

pub(super) fn describe_item(item: &ExternalDropItemInfo) -> String {
    let kind = match item.kind {
        ExternalDropItemKind::File => "file",
        _ => "item",
    };
    let mime = item.mime_type.as_deref().unwrap_or("unknown");
    format!(
        "{} ({}, {}, {} bytes)",
        item.name, kind, mime, item.size_bytes as u64
    )
}

pub(super) fn output_file_name_label(output_file_name: &Option<String>) -> String {
    output_file_name
        .as_deref()
        .map(str::to_owned)
        .unwrap_or_else(|| "(stream)".to_string())
}

pub(super) fn worker_result_hash_label(worker_result: &Option<String>) -> String {
    match worker_result.as_deref() {
        Some(value) => format!(" — hash: {}", value),
        None => String::new(),
    }
}

pub(super) fn resolve_copy_file_name(file: &BrowserFile) -> String {
    let name = file.name();
    if let Some((base, ext)) = name.rsplit_once('.') {
        if !base.is_empty() && !ext.is_empty() {
            return format!("{}-copy.{}", base, ext);
        }
    }
    format!("{}-copy", name)
}
