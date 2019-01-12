def _get_root_of_files(files):
    expected_root = files[0].root

    for file in files:
        if file.root != expected_root:
            return None

    return expected_root

def _get_output_root_of_target(target, target_files):
    if len(target_files) > 1:
        base_root = _get_root_of_files(target_files)

        if not base_root:
            fail("Could not determine root for %s. Make sure that the target does not have output files mixed up with sources. This is not supported." % target.label)

        pkg_root = base_root.path

        if len(pkg_root):
            pkg_root += "/"

        return pkg_root + "%s/%s" % (target.label.workspace_root, target.label.package)
    else:
        # In case of a tree artifact
        return target_files[0].path

def _build_ngc(ctx):
    package_import_files = []
    output_dir = ctx.actions.declare_directory("ngc_build_output")

    args = ctx.actions.args()

    args.add(ctx.label.package) # Source Dir
    args.add(output_dir.path) # Output Dir
    args.add(ctx.files.tsconfig) # Tsconfig Path relative.
    args.add_joined(ctx.files.srcs, join_with = ",") # Source files that need to be copied.

    for import_target, import_name in ctx.attr.npm_imports.items():
        pkg_files = import_target.files.to_list()
        pkg_root = _get_output_root_of_target(import_target, pkg_files)

        # Keep track of all import files that are required. This will be passed as
        # an input to the Bazel action.
        package_import_files += pkg_files

        args.add("%s,%s" % (import_name, pkg_root))

    ctx.actions.run(
        progress_message = "Running NGC for %s" % ctx.label,
        mnemonic = "NGCBuild",
        inputs = ctx.files.srcs + ctx.files.tsconfig + package_import_files,
        outputs = [output_dir],
        executable = ctx.executable._build_ngc,
        arguments = [args],
    )

    return DefaultInfo(files = depset([output_dir]))

build_ngc = rule(
    implementation = _build_ngc,
    attrs = {
        "srcs": attr.label_list(mandatory = True, allow_files = True),
        "tsconfig": attr.label(allow_single_file = True, mandatory = True),
        "npm_imports": attr.label_keyed_string_dict(allow_files = True),

        "_build_ngc": attr.label(
            default = Label("//packages/compiler-cli/integrationtest:build-ngc"),
            executable = True,
            cfg = "host"
        ),
    },
)
