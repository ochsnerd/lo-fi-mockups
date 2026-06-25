#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().level(tauri_plugin_log::log::LevelFilter::Debug).build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_cli::init())
    .plugin(tauri_plugin_fs::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
