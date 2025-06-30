#
# Copyright © 2024 Intel Corporation
# SPDX-License-Identifier: Apache 2.0
#

cmake_minimum_required(VERSION 3.16)

project(BCVPU_NPU_Architecture)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 14)

if(CMAKE_C_COMPILER_ID MATCHES "Clang" OR CMAKE_C_COMPILER_ID MATCHES "GNU")
    # Compiler flags for GCC/Clang
    add_compile_options(-Wall -Wextra -Wno-error -pedantic -march=native)
    set(CMAKE_C_FLAGS_DEBUG "-g")
    set(CMAKE_C_FLAGS_RELEASE "-O3")
elseif(CMAKE_C_COMPILER_ID MATCHES "MSVC")
    # Compiler flags for MSVC
    add_compile_options(/W3 /arch:AVX2)
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# BCVPU source files
set(BCVPU_SOURCES
    module.c
    bcvpu_core.c
    npu_integration.c
)

# Create BCVPU static library
add_library(bcvpu_lib STATIC ${BCVPU_SOURCES})

# Create main executable
add_executable(bcvpu_demo main.c)

# Link the library to the executable
target_link_libraries(bcvpu_demo bcvpu_lib)

# Add pthread for threading support (if available)
find_package(Threads)
if(Threads_FOUND)
    target_link_libraries(bcvpu_demo ${CMAKE_THREAD_LIBS_INIT})
endif()

# Installation
install(TARGETS bcvpu_demo
        RUNTIME DESTINATION bin)

install(TARGETS bcvpu_lib
        ARCHIVE DESTINATION lib)

install(FILES 
        module.h
        bcvpu_core.h
        npu_integration.h
        DESTINATION include/bcvpu)

# Optional: Add tests if needed
option(BUILD_BCVPU_TESTS "Build BCVPU tests" OFF)

if(BUILD_BCVPU_TESTS)
    enable_testing()
    
    # Simple test executable
    add_executable(bcvpu_test test_bcvpu.c)
    target_link_libraries(bcvpu_test bcvpu_lib)
    
    add_test(NAME bcvpu_basic_test COMMAND bcvpu_test)
endif()

# Display build information
message(STATUS "BCVPU Architecture Build Configuration:")
message(STATUS "  Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  C Compiler: ${CMAKE_C_COMPILER_ID}")
message(STATUS "  Install Prefix: ${CMAKE_INSTALL_PREFIX}")
message(STATUS "  Build Tests: ${BUILD_BCVPU_TESTS}")