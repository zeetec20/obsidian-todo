# TEMPLATE — do not install this file directly.
# Run scripts/build-release.sh to generate the filled-in formula at dist/otodo.rb,
# then copy that into your homebrew-otodo tap's Formula/ directory.
class Otodo < Formula
  desc "Browse Obsidian vault TODO.md tasks in a terminal UI"
  homepage "https://github.com/__GH_OWNER__/obsidian-todo"
  version "__VERSION__"

  # Apple Silicon only. Intel hosted runners are retired, so no x64 binary is built.
  depends_on arch: :arm64
  depends_on :macos

  url "https://github.com/__GH_OWNER__/obsidian-todo/releases/download/v#{version}/otodo-darwin-arm64.tar.gz"
  sha256 "__SHA_ARM64__"

  def install
    bin.install "otodo-darwin-arm64" => "otodo"
  end

  test do
    assert_match "Obsidian TODO", shell_output("#{bin}/otodo --help")
  end
end
