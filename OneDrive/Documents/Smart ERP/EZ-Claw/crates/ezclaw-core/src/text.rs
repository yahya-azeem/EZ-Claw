//! Text processing — token estimation and text utilities.
//!
//! Provides the same ~4 chars/token estimation used throughout ZeroClaw
//! (see StreamChunk::with_token_estimate in providers/traits.rs).

use wasm_bindgen::prelude::*;

/// Estimate tokens for a text string.
/// Uses ZeroClaw's approximation: ~4 characters per token.
/// (See StreamChunk::with_token_estimate in providers/traits.rs)
pub fn estimate_tokens(text: &str) -> u32 {
    (text.len().div_ceil(4)) as u32
}

/// Estimate tokens for a text string (WASM export).
#[wasm_bindgen]
pub fn wasm_estimate_tokens(text: &str) -> u32 {
    estimate_tokens(text)
}

/// Strip HTML/markdown tags for cleaner text processing.
#[wasm_bindgen]
pub fn strip_markdown(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut in_tag = false;
    let mut in_code_block = false;
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Handle code blocks (```)
        if i + 2 < len && chars[i] == '`' && chars[i + 1] == '`' && chars[i + 2] == '`' {
            in_code_block = !in_code_block;
            i += 3;
            // Skip optional language identifier after opening ```
            if in_code_block {
                while i < len && chars[i] != '\n' {
                    i += 1;
                }
            }
            continue;
        }

        if in_code_block {
            result.push(chars[i]);
            i += 1;
            continue;
        }

        // Handle inline code (`...`)
        if chars[i] == '`' {
            i += 1;
            while i < len && chars[i] != '`' {
                result.push(chars[i]);
                i += 1;
            }
            if i < len {
                i += 1;
            }
            continue;
        }

        // Handle HTML tags
        if chars[i] == '<' {
            in_tag = true;
            i += 1;
            continue;
        }
        if chars[i] == '>' && in_tag {
            in_tag = false;
            i += 1;
            continue;
        }
        if in_tag {
            i += 1;
            continue;
        }

        // Handle markdown headings (# at start of line)
        if chars[i] == '#' && (i == 0 || chars[i - 1] == '\n') {
            while i < len && chars[i] == '#' {
                i += 1;
            }
            if i < len && chars[i] == ' ' {
                i += 1;
            }
            continue;
        }

        // Handle bold (**) and italic (*/_)
        if chars[i] == '*' || chars[i] == '_' {
            let marker = chars[i];
            let mut count = 0;
            while i < len && chars[i] == marker {
                count += 1;
                i += 1;
            }
            // Skip markers (bold/italic), keep content
            let _ = count;
            continue;
        }

        // Handle links [text](url) -> keep text
        if chars[i] == '[' {
            i += 1;
            while i < len && chars[i] != ']' {
                result.push(chars[i]);
                i += 1;
            }
            if i < len {
                i += 1; // skip ]
            }
            // Skip (url) part
            if i < len && chars[i] == '(' {
                while i < len && chars[i] != ')' {
                    i += 1;
                }
                if i < len {
                    i += 1;
                }
            }
            continue;
        }

        result.push(chars[i]);
        i += 1;
    }

    result
}

/// Truncate text to approximately N tokens.
#[wasm_bindgen]
pub fn truncate_to_tokens(text: &str, max_tokens: u32) -> String {
    let max_chars = max_tokens as usize * 4;
    if text.len() <= max_chars {
        return text.to_string();
    }

    // Find a clean boundary (space or newline)
    let boundary = text[..max_chars]
        .rfind(|c: char| c == ' ' || c == '\n')
        .unwrap_or(max_chars);

    let mut result = text[..boundary].to_string();
    result.push_str("...");
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_estimation_basic() {
        assert_eq!(estimate_tokens(""), 0);
        assert_eq!(estimate_tokens("Hi"), 1); // 2 chars / 4 = 0.5, ceil = 1
        assert_eq!(estimate_tokens("Hello world!"), 3); // 12 chars / 4 = 3
    }

    #[test]
    fn strip_markdown_headers() {
        let result = strip_markdown("# Hello\n## World");
        assert!(result.contains("Hello"));
        assert!(result.contains("World"));
        assert!(!result.contains('#'));
    }

    #[test]
    fn strip_markdown_bold_italic() {
        let result = strip_markdown("This is **bold** and *italic*");
        assert!(result.contains("bold"));
        assert!(result.contains("italic"));
        assert!(!result.contains('*'));
    }

    #[test]
    fn strip_markdown_links() {
        let result = strip_markdown("Click [here](https://example.com) for more");
        assert!(result.contains("here"));
        assert!(!result.contains("https://"));
    }

    #[test]
    fn truncate_to_tokens_short_text() {
        let text = "Hello";
        assert_eq!(truncate_to_tokens(text, 100), "Hello");
    }

    #[test]
    fn truncate_to_tokens_long_text() {
        let text = "a ".repeat(100);
        let result = truncate_to_tokens(&text, 5); // ~20 chars
        assert!(result.len() < 30);
        assert!(result.ends_with("..."));
    }
}
