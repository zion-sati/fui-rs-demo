# FUI-RS Demo

The public universal demo for
[FUI-RS](https://github.com/zion-sati/fui-rs), a web-born, cross-platform
retained Rust UI framework.

The same shared application pages run:

- In browsers through WebAssembly.
- Natively on macOS, Windows, and Linux without Electron or a WebView.

Android and iOS are not supported yet. FUI-RS is feature-rich early access and
may make breaking changes before 1.0.

## Try it

- [Run the live browser demo](https://fui-rs-demo.effindom.dev/)
- [Download unsigned native developer previews](https://github.com/zion-sati/fui-rs-demo/releases)
- [Read the FUI-RS documentation](https://github.com/zion-sati/fui-rs)
- [Install `cargo-fui`](https://github.com/zion-sati/cargo-fui)

Building the native demo locally is the recommended path. Unsigned GitHub-built
developer previews are also available for all six desktop targets, but macOS
and Windows can show platform trust warnings because Zion Sati operates
pseudonymously and does not publish through identity-backed signing services.

## Unsigned native developer previews

Each [FUI-RS Demo GitHub prerelease](https://github.com/zion-sati/fui-rs-demo/releases)
contains portable archives for macOS, Windows, and Linux on ARM64 and x64.

These are deliberately archives rather than unsigned MSIX installers. Every
archive has a SHA-256 checksum and GitHub build-provenance attestation tied to
this public repository, commit, and workflow. With the GitHub CLI installed:

```bash
gh attestation verify path/to/fui-rs-demo-archive \
  --repo zion-sati/fui-rs-demo
```

An attestation proves where an archive was built; it does not suppress
SmartScreen or Gatekeeper. Managed Windows machines can prohibit unsigned
executables entirely. Do not install a self-signed root certificate to run this
demo; build from source instead when platform policy prevents an unsigned
preview from launching.

## Build the native demo from source

[`cargo-fui`](https://github.com/zion-sati/cargo-fui) is the first-party FUI-RS
project, development, build, and native packaging tool.

Install the platform compiler and linker first:

- macOS: Xcode Command Line Tools.
- Windows: Visual Studio 2022 Build Tools with **Desktop development with C++**
  and a Windows SDK. Windows ARM64 also needs the ARM64 C++ build tools.
- Linux: a C/C++ toolchain and the Vulkan, Fontconfig, D-Bus, X11, and Xext
  development libraries used by EffinDOM.

Then install stable Rust and `cargo-fui`:

```bash
rustc --version
cargo --version
cargo install --locked cargo-fui
cargo fui --help
```

Clone this repository and enter its exported source directory:

```bash
git clone https://github.com/zion-sati/fui-rs-demo.git
cd fui-rs-demo/fui-rs-demo-source
npm install
cargo fui build --release
```

The command builds the optimized native application and browser deployment and
prints the native bundle location under `target/fui/`.

## Browser development

Universal projects require a current Node.js 24 release and npm for their
WebAssembly target:

```bash
npm install
cargo fui dev
```

`cargo fui dev` builds and serves the browser adapter with development-oriented
compilation settings.

## Native packaging

```bash
cargo fui package
```

`cargo-fui` emits the current platform format under `target/fui/`:

- macOS: DMG containing the application bundle.
- Windows: MSIX.
- Linux: AppImage.

Production signing identities, notarization credentials, store accounts, and
distribution policy belong to the application owner. This demo does not ask
users to install or trust a self-signed root certificate.

## Shared application architecture

- `crates/ui` owns the target-independent retained UI and service contracts.
- `crates/routes` contains the shared demo pages.
- `crates/worker` runs as a browser Worker or a native background thread.
- `crates/native` is the thin native composition adapter.
- `crates/web` is the thin WebAssembly composition adapter.
- `crates/ui/src/services/native.rs` and `web.rs` keep platform services
  explicit while preserving shared page code.
- `fui.toml` defines application metadata, workers, assets, targets, and
  packaging settings.
- `assets/application-icon.png` is the canonical cross-platform application
  icon source.

## Related projects

- [FUI-RS](https://github.com/zion-sati/fui-rs)
- [`cargo-fui`](https://github.com/zion-sati/cargo-fui)
- [EffinDOM](https://github.com/zion-sati/EffinDOM)
- [Galaga-RS](https://github.com/jatm80/galaga-rs), the first known
  community-built FUI-RS application

Report framework problems in FUI-RS and project, build, or packaging problems
in `cargo-fui`.
