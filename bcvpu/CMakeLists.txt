#
# Copyright © 2024 Intel Corporation
# SPDX-License-Identifier: Apache 2.0
#

cmake_minimum_required(VERSION 3.16)

# BCVPU C/C++ Implementation
project(BCVPU_NPU_Architecture)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 14)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# BCVPU Library
set(BCVPU_SOURCES
    module.c
    bcvpu_core.c
    npu_integration.c
)

set(BCVPU_HEADERS
    module.h
    bcvpu_core.h
    npu_integration.h
)

# Create static library for BCVPU modules
add_library(bcvpu_static STATIC ${BCVPU_SOURCES})

# Create shared library for BCVPU modules (optional)
add_library(bcvpu_shared SHARED ${BCVPU_SOURCES})

# Set library properties
set_target_properties(bcvpu_static PROPERTIES
    OUTPUT_NAME bcvpu
    PUBLIC_HEADER "${BCVPU_HEADERS}"
)

set_target_properties(bcvpu_shared PROPERTIES
    OUTPUT_NAME bcvpu
    VERSION 1.0.0
    SOVERSION 1
    PUBLIC_HEADER "${BCVPU_HEADERS}"
)

# Main demonstration executable
add_executable(bcvpu_demo main.c)

# Link BCVPU library to demo
target_link_libraries(bcvpu_demo bcvpu_static)

# Add math library for trigonometric functions
target_link_libraries(bcvpu_demo m)

# Compiler flags for debugging and optimization
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_options(bcvpu_static PRIVATE -g -O0 -Wall -Wextra)
    target_compile_options(bcvpu_shared PRIVATE -g -O0 -Wall -Wextra)
    target_compile_options(bcvpu_demo PRIVATE -g -O0 -Wall -Wextra)
else()
    target_compile_options(bcvpu_static PRIVATE -O3 -Wall -Wextra)
    target_compile_options(bcvpu_shared PRIVATE -O3 -Wall -Wextra)
    target_compile_options(bcvpu_demo PRIVATE -O3 -Wall -Wextra)
endif()

# Enable position independent code for shared library
set_target_properties(bcvpu_shared PROPERTIES POSITION_INDEPENDENT_CODE ON)

# Installation rules
install(TARGETS bcvpu_static bcvpu_shared bcvpu_demo
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
    PUBLIC_HEADER DESTINATION include/bcvpu
)

# Install additional files
install(FILES README.md DESTINATION share/doc/bcvpu)

# Create README for BCVPU
file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/README.md
"# BCVPU (Brain Computing Virtual Processing Unit) - C/C++ Implementation

This directory contains the C/C++ implementation of the modular BCVPU architecture.

## Components

- **module.c/h**: Core module definitions and implementations
- **bcvpu_core.c/h**: Central BCVPU orchestrator
- **npu_integration.c/h**: Intel NPU acceleration integration
- **main.c**: Demonstration program

## Building

```bash
mkdir build && cd build
cmake ..
make
```

## Running

```bash
# Run the demonstration
./bcvpu_demo

# Enable NPU simulation
BCVPU_SIMULATE_NPU=1 ./bcvpu_demo
```

## Architecture

The BCVPU architecture consists of three main cognitive modules:

1. **Memory Module**: Handles data storage and retrieval operations
2. **Decision-Making Module**: Processes AI inference and decision logic
3. **Sensory Processing Module**: Handles input processing and pattern recognition

Each module can leverage Intel NPU acceleration when available.
")

# Test target
enable_testing()

# Simple test to verify the demo runs
add_test(NAME bcvpu_demo_test COMMAND bcvpu_demo)

# Environment variable test for NPU simulation
add_test(NAME bcvpu_npu_simulation_test COMMAND ${CMAKE_COMMAND} -E env BCVPU_SIMULATE_NPU=1 $<TARGET_FILE:bcvpu_demo>)

# Print build information
message(STATUS "BCVPU C/C++ Implementation Configuration:")
message(STATUS "  Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  C Compiler: ${CMAKE_C_COMPILER}")
message(STATUS "  CXX Compiler: ${CMAKE_CXX_COMPILER}")
message(STATUS "  Install Prefix: ${CMAKE_INSTALL_PREFIX}")