Here’s a cleaner, AI-oriented version of your project description, rewritten so an AI agent, engineer, or technical reviewer can quickly understand the architecture, goals, and current status.

---

## 🧭 Project Overview

I am developing a demo solution that consists of:

- a **web project**
- a **TIA Portal project**
- a **WinCC Unified (UBP) interface**
- a **SIMATIC S7-1511T PLC** as the controller and recipe data host

The goal of the demo is to validate the PLC’s capability for **recipe storage**, **layer pattern handling**, and **interactive pallet pattern editing**.

---

## 🎯 Main Objectives

This demo is intended to prove that the **S7-1511T PLC** can support the following:

- storage of up to **200 recipes**
- support for up to **100 boxes in each layer pattern**
- drag-and-drop editing of box layouts inside a workspace
- saving, loading, and editing of layer pattern layouts

---

## 🏗️ System Architecture

The solution uses a **hybrid architecture** with two UI layers.

### Web side
The **web-based application** is responsible for:
- drag-and-drop pattern editing
- visual box placement in the workspace
- saving layer pattern layouts
- loading existing layer pattern layouts
- editing existing layer pattern layouts

Technical details:
- built using the **VITA barebone framework**
- deployed on the **SIMATIC S7-1511T PLC web server**
- communicates with the PLC through the **S7 Webserver API**

### WinCC Unified / UBP side
The **WinCC Unified interface** is responsible for:
- parameter setting
- recipe library overview
- browsing saved pallet recipes
- selecting recipes and layers
- displaying recipe metadata and configuration data

---

## ✅ Current Development Status

### Completed
- The **web editor development is finished**

### Current focus
- I am now focusing on the **WinCC Unified screen development**

The Unified screen should allow users to look up saved pallet-type recipe pattern libraries and review the stored recipe content.

---

## 📦 Recipe Library Requirements

The recipe library should store the following data for each recipe:

### General recipe information
- recipe name or recipe ID
- pallet type

### Pallet data
- pallet base width
- pallet base length

### Box data
- box height
- box length
- box width

### Layer data
- layer configurations
- each layer pattern
- number of boxes in each layer

### Pattern data
For each box in a layer pattern:
- box position
- orientation / rotation
- layout arrangement inside the workspace

---

## 🔄 Planned Hybrid Concept

The current concept is to combine:

- **web access / web control** for drag-and-drop pattern editing
- **WinCC Unified (UBP)** for recipe library overview and parameter management

This means:

| **Component** | **Responsibility** |
|---|---|
| **Web editor** | Drag-and-drop editing, pattern save/load/edit, layer workspace interaction |
| **WinCC Unified** | Parameter setting, recipe library browsing, recipe selection, metadata overview |
| **S7-1511T PLC** | Recipe storage, pattern data storage, communication and execution logic |

---

## 🖼️ Interpretation of the Uploaded Customer UI Layout

Based on the uploaded screenshots, the current customer UI appears to contain these main functional screens.

### 1. Runtime / production screen
This screen includes:
- left pallet and right pallet status
- current pallet box count
- current layer box count
- current layer number
- total pallet count
- ready / running / full pallet states
- start, cancel, and reset-style actions

### 2. Box and pallet parameter screen
This screen includes:
- incoming box direction
- box dimensions:
- length
- width
- height
- pallet dimensions:
- X-direction length
- Y-direction length
- height

### 3. Layer pattern overview screen
This screen includes:
- layer pattern groups such as A1, A2, A3, A4 and B1, B2, B3, B4
- preview thumbnails of stored layouts
- save, advanced, and test functions

### 4. Layer pattern editor screen
This screen includes:
- visual workspace for box layout
- selected box coordinate fields
- move tools
- alignment tools
- transformation tools
- multi-select / select-all
- save / save-as actions

This confirms that your hybrid design is reasonable:
- **WinCC Unified** can provide overview and parameter pages
- **web UI** can provide the richer editing experience

---

## 📁 Uploaded Engineering Inputs

The uploaded materials include:

- current **DB blocks**
- current **FB blocks**
- current **OB blocks**
- the **customer’s current demo UI layout**

These should be treated as project inputs for:
- PLC data model understanding
- PLC control logic reference
- UI workflow alignment with the customer’s existing system

---

## 🤖 AI-Readable Project Context

An AI model should interpret this project as follows:

### Context
This is a **PLC + Web + WinCC Unified** demo project for pallet pattern recipe handling.

### PLC platform
- **SIMATIC S7-1511T**

### Main proof points
- up to **200 stored recipes**
- up to **100 boxes per layer pattern**
- drag-and-drop editing of box placement
- save/load/edit capability for layer pattern layouts

### UI split
- **web side** for pattern editing
- **Unified side** for recipe library overview and parameter setting

### Current status
- web editor already completed
- Unified screen is the current development task

### Data model
Each recipe should include:
- pallet type
- pallet dimensions
- box dimensions
- layer configuration
- layer patterns

---

## 💡 Compact AI-Ready Version

I am developing a demo solution for a **SIMATIC S7-1511T PLC** that consists of a **web project** and a **TIA Portal / WinCC Unified project**.

### Main objectives
The demo should prove that the PLC can:
- store up to **200 recipes**
- support up to **100 boxes per layer pattern**
- support **drag-and-drop editing** of box layouts in a workspace
- support **save, load, and edit** operations for layer pattern layouts

### Current architecture
- web editor built with **VITA barebone framework**
- deployed on the **S7-1511T PLC web server**
- communication through **S7 Webserver API**

### Functional split
- **web side** = drag-and-drop pattern editor, save/load/edit layer patterns
- **WinCC Unified side** = parameter setting, recipe library overview, recipe lookup

### Current status
- web editor development is complete
- current focus is developing the **WinCC Unified interface**

### Recipe library contents
- pallet type
- layer configurations
- each layer pattern
- pallet base dimensions: width and length
- box dimensions: height, length, width

### Uploaded project assets
- current PLC **DB / FB / OB**
- current customer UI screenshots

---

## ✅ Best final version

I am developing a demo solution based on a **SIMATIC S7-1511T PLC**, consisting of a **web project** and a **TIA Portal / WinCC Unified project**.

The main purpose of the demo is to validate that the PLC can:

- store up to **200 recipes**
- support up to **100 boxes in each layer pattern**
- support **drag-and-drop editing** of box layouts in a workspace
- support **saving, loading, and editing** of layer pattern layouts

The system uses a **hybrid architecture**:

- the **web side** is used for drag-and-drop pattern editing and layer layout save/load/edit functions
- the **WinCC Unified side** is used for parameter setting, recipe library overview, and recipe lookup

The web editor has already been completed using the **VITA barebone framework**, deployed on the **SIMATIC S7-1511T PLC web server**, and communicates with the PLC through the **S7 Webserver API**.

My current development focus is the **WinCC Unified interface**, which should allow users to browse and review a saved **pallet recipe pattern library**.

Each recipe in the library should store:
- pallet type
- layer configurations
- pattern data for each layer
- pallet base dimensions: width and length
- box dimensions: height, length, and width

The uploaded materials include the current **DB, FB, and OB** in the S7-1511T, along with the **customer’s current UI layout screenshots**, which serve as references for the runtime screen, parameter setting screen, layer pattern overview screen, and layer pattern editor workflow.

The goal is to build a demo that keeps the customer’s familiar workflow while separating responsibilities clearly between the **web-based editor** and the **WinCC Unified overview interface**.