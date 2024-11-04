use tauri_plugin_sql::{Migration, MigrationKind};  

#[tauri::command]  
fn greet(name: &str) -> String {  
    format!("Hello, {}! You've been greeted from Rust!", name)  
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]  
pub fn run() {  
    let migrations = vec![  
        Migration {  
            version: 1,  
            description: "create users table",  
            sql: "CREATE TABLE IF NOT EXISTS users (  
                id INTEGER PRIMARY KEY AUTOINCREMENT,  
                name TEXT NOT NULL,  
                email TEXT  
            )",  
            kind: MigrationKind::Up,  
        }  
    ];  

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_shell::init())  
        .invoke_handler(tauri::generate_handler![greet])  
        .run(tauri::generate_context!())  
        .expect("error while running Tauri application");  
}
