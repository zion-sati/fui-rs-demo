use super::*;
pub(super) struct HomeVirtualListRow {
    container: FlexBox,
    title: TextNode,
    description: TextNode,
    index: Rc<Cell<i32>>,
}

impl HomeVirtualListRow {
    fn new(container: &FlexBox) -> Self {
        let title = demo_text("", DemoTextStyle::Body);
        let description = demo_text("", DemoTextStyle::Caption);
        let index = Rc::new(Cell::new(0));
        container.bind_theme({
            let index = index.clone();
            move |row, theme| apply_row_background(row, index.get(), &theme)
        });
        container
            .fill_width()
            .padding(16.0, 8.0, 8.0, 8.0)
            .corner_radius(12.0)
            .children(children![
                title,
                flex_box().fill_width().height(4.0, Unit::Pixel),
                description,
            ]);
        Self {
            container: container.clone(),
            title,
            description,
            index,
        }
    }

    fn bind(&self, index: i32) {
        self.index.set(index);
        apply_row_background(&self.container, index, &current_theme());
        self.title.text(format!("Item {index}"));
        self.description
            .text(format!("Description for item {index}"));
    }
}

pub(super) fn create_virtual_list() -> VirtualList<HomeVirtualListRow> {
    let list = virtual_list(VIRTUAL_LIST_ITEMS, VIRTUAL_LIST_ITEM_HEIGHT)
        .item_template(HomeVirtualListRow::new);
    list.node_id("VirtualList")
        .fill_size()
        .on_bind_item(HomeVirtualListRow::bind);
    list.scroll_box().scrollbar_gutter(8.0);
    list.scroll_box()
        .vertical_scrollbar()
        .track_corner_radius(8.0)
        .thumb_corner_radius(8.0);
    list
}
