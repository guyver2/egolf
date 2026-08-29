use askama::Template;
use axum::response::{Html, IntoResponse, Response};

pub fn render<T: Template>(tmpl: T) -> Response {
    Html(tmpl.render().unwrap_or_else(|e| format!("Template error: {e}"))).into_response()
}
