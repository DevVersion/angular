load("//tools:defaults.bzl", "protractor_web_test_suite")

"""
  Macro that can be used to define a e2e test in `modules/benchmarks`. Targets created through
  this macro differentiate from a "benchmark_test" as they will run on CI and do not run
  with `@angular/benchpress`.
"""

def e2e_test(name, server, deps, **kwargs):
    protractor_web_test_suite(
        name = name,
        on_prepare = "//modules/benchmarks:start-server.js",
        server = server,
        # `yargs` is needed as runtime dependency for the e2e utils.
        deps = ["@npm//yargs"] + deps,
        **kwargs
    )
