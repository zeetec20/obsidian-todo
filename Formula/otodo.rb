# TEMPLATE — do not install this file directly.
# Run scripts/build-release.sh to generate the filled-in formula at dist/otodo.rb,
# then copy that into your homebrew-otodo tap's Formula/ directory.
class Otodo < Formula
  desc "Browse Obsidian vault TODO.md tasks in a terminal UI"
  homepage "https://github.com/__GH_OWNER__/obsidian-todo"
  version "__VERSION__"

  on_macos do
    on_arm do
      url "https://github.com/__GH_OWNER__/obsidian-todo/releases/download/v#{version}/otodo-darwin-arm64.tar.gz"
      sha256 "__SHA_ARM64__"
    end
    on_intel do
      url "https://github.com/__GH_OWNER__/obsidian-todo/releases/download/v#{version}/otodo-darwin-x64.tar.gz"
      sha256 "__SHA_X64__"
    end
  end

  def install
    bin.install (Hardware::CPU.arm? ? "otodo-darwin-arm64" : "otodo-darwin-x64") => "otodo"
  end

  test do
    assert_match "Obsidian TODO", shell_output("#{bin}/otodo --help")
  end
end
