use super::*;
pub(super) fn create_custom_bitmap() -> Bitmap {
    let bitmap = Bitmap::new(DEMO_BITMAP_SIZE, DEMO_BITMAP_SIZE);
    let center = (DEMO_BITMAP_SIZE as f64 - 1.0) * 0.5;
    let scale = DEMO_BITMAP_SIZE as f64 / 96.0;
    let radius = 34.0 * scale;
    let radius_squared = radius * radius;
    let min_square = (20.0 * scale) as i32;
    let max_square = (76.0 * scale) as i32;
    let diag_min = (93.0 * scale) as i32;
    let diag_max = (99.0 * scale) as i32;
    {
        let mut pixels = bitmap.pixels();
        for y in 0..DEMO_BITMAP_SIZE as i32 {
            for x in 0..DEMO_BITMAP_SIZE as i32 {
                let dx = x as f64 - center;
                let dy = y as f64 - center;
                let distance_squared = dx * dx + dy * dy;
                let mut color = None;
                if distance_squared <= radius_squared {
                    let falloff = 1.0 - distance_squared / radius_squared;
                    color = Some((0xff, 0x40, 0x40, (64.0 + falloff * 144.0) as u8));
                }
                if x >= min_square && x <= max_square && y >= min_square && y <= max_square {
                    let diagonal = x + y;
                    if diagonal >= diag_min && diagonal <= diag_max {
                        color = Some((0xff, 0xff, 0x22, 0xd8));
                    }
                }
                if let Some((red, green, blue, alpha)) = color {
                    let offset = ((x + y * DEMO_BITMAP_SIZE as i32) * 4) as usize;
                    let premultiply =
                        |channel: u8| ((channel as u32 * alpha as u32 + 127) / 255) as u8;
                    pixels[offset] = premultiply(red);
                    pixels[offset + 1] = premultiply(green);
                    pixels[offset + 2] = premultiply(blue);
                    pixels[offset + 3] = alpha;
                }
            }
        }
    }
    bitmap.commit();
    bitmap
}
