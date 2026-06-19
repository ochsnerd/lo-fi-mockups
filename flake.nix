{
  description = "Lofi Mockups — Tauri app)";

  inputs = {
    nixpkgs.url = "nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    let
      cargoToml = builtins.fromTOML (builtins.readFile ./src-tauri/Cargo.toml);

      # The name a consuming flake references the package by, i.e.
      # `pkgs.${attrName}` / `with pkgs; [ ${attrName} ]`.
      # Defaults to the crate name in Cargo.toml — change to "lofi" if you want.
      attrName = cargoToml.package.name;

      # The package as a function of *a* pkgs set. Reused in two places:
      #   - the overlay, where it's built with the CONSUMER's nixpkgs
      #   - this flake's own packages, built with the nixpkgs pinned above
      mkLofi =
        pkgs:
        pkgs.rustPlatform.buildRustPackage (finalAttrs: {
          pname = cargoToml.package.name;
          version = cargoToml.package.version;
          src = ./.;

          cargoLock = {
            lockFile = ./src-tauri/Cargo.lock;
            # For git deps: allowBuiltinFetchGit = true; (or pin outputHashes)
          };

          npmDeps = pkgs.fetchNpmDeps {
            name = "${finalAttrs.pname}-${finalAttrs.version}-npm-deps";
            inherit (finalAttrs) src;
            # Fill in:  nix run nixpkgs#prefetch-npm-deps ./package-lock.json
            hash = "sha256-wIkNJ8wxETQQEtYjG6UoHfViadsyq0AZlosfiBPjD+A=";
          };

          nativeBuildInputs = with pkgs; [
            cargo-tauri.hook
            nodejs_24
            npmHooks.npmConfigHook
            pkg-config
            wrapGAppsHook4
          ];

          buildInputs = with pkgs; [
            glib-networking # drop if your app is offline-only
            librsvg
            openssl
            webkitgtk_4_1
            dbus
          ];

          cargoRoot = "src-tauri";
          buildAndTestSubdir = finalAttrs.cargoRoot;

          meta = {
            description = "Lofi Mockups";
            platforms = pkgs.lib.platforms.linux;
            mainProgram = finalAttrs.pname; # binary name; lets lib.getExe work
          };
        });

      # Export an overlay to be able to use it as input in other flakes
      overlay = final: prev: {
        ${attrName} = mkLofi final;
      };
    in
    {
      overlays.default = overlay;
    }
    // flake-utils.lib.eachSystem [ "x86_64-linux" ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [ overlay ];
        };
        lofi = pkgs.${attrName};
      in
      {
        # nix build            -> ./result/bin/<app>
        # nix build .#${attrName}
        packages.default = lofi;
        packages.${attrName} = lofi;

        # nix run
        apps.default = {
          type = "app";
          program = pkgs.lib.getExe lofi;
        };

        # nix develop
        devShell =
          with pkgs;
          mkShell {
            buildInputs = [
              pkg-config
              wrapGAppsHook4
              cargo
              cargo-tauri
              rustc
              librsvg
              webkitgtk_4_1
              # fixing `cargo tauri dev` errors
              dbus
              typescript-language-server
              nodejs_24
              # `npm install -g ...` is handled via .envrc
            ];
            shellHook = ''
              # Needed on Wayland to report the correct display scale
                export XDG_DATA_DIRS="$GSETTINGS_SCHEMAS_PATH"
            '';
          };
      }
    );
}
