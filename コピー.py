import os
import pyperclip

def generate_tree_structure(start_path, ignore_dirs):
    """
    指定されたパスからツリー構造の文字列を生成します。
    ignore_dirsリストに含まれるディレクトリは無視します。
    """
    tree_lines = []
    
    # os.walkを使ってディレクトリを再帰的に探索
    for root, dirs, files in os.walk(start_path, topdown=True):
        # --- ▼▼▼ ここが改良点 ▼▼▼ ---
        # ignore_dirsに含まれるディレクトリを探索対象から除外する
        # dirsリストを直接書き換えることで、os.walkはその中を探索しなくなります。
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        # --- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ ---

        # 階層の深さを計算
        relative_path = os.path.relpath(root, start_path)
        if relative_path == ".":
            level = 0
            tree_lines.append(f"📂 {os.path.basename(start_path)}/")
        else:
            level = len(relative_path.split(os.sep))
            indent = '│   ' * (level - 1) + '├── '
            tree_lines.append(f"{indent}📂 {os.path.basename(root)}/")

        file_indent = '│   ' * level + '├── '
        
        files.sort()
        for f in files:
            tree_lines.append(f"{file_indent}📄 {f}")
            
        dirs.sort()
        
    return "\n".join(tree_lines)

def main():
    """
    メイン処理を実行する関数
    """
    # --- ▼▼▼ 無視したいフォルダのリスト（ここでカスタマイズ可能） ▼▼▼ ---
    IGNORE_DIRECTORIES = [
        "node_modules",
        ".git",
        "__pycache__",
        ".vscode",
        "venv",
        ".venv",
        "dist",
        "build"
    ]
    # --- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ ---

    current_directory = os.getcwd()
    print(f"調査対象のフォルダ: {current_directory}")
    print(f"無視するフォルダ: {', '.join(IGNORE_DIRECTORIES)}")

    try:
        # フォルダ構成をツリー形式の文字列として生成（無視リストを渡す）
        folder_tree_string = generate_tree_structure(current_directory, IGNORE_DIRECTORIES)

        pyperclip.copy(folder_tree_string)

        print("\n✅ フォルダとファイルの構成をクリップボードにコピーしました。")
        print("   （指定された無視フォルダは除外されています）")
        
        print("\n--- コピーされた内容 ---")
        print(folder_tree_string)
        print("------------------------")

    except FileNotFoundError:
        print(f"エラー: 指定されたフォルダが見つかりません: {current_directory}")
    except pyperclip.PyperclipException:
        print("\n❌ エラー: クリップボードへのコピーに失敗しました。")
        print(" 'pyperclip' ライブラリが正しくインストールされているか確認してください。")
    except Exception as e:
        print(f"予期せぬエラーが発生しました: {e}")


if __name__ == "__main__":
    main()