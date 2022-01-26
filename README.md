# HKAT
This is a feature-full rewrite of [the previous HKAT project](https://github.com/RanDumSocks/HKAutoTracker), but now standalone!

This is a auto-tracker for the [Randomiser 4](https://github.com/homothetyhk/RandomizerMod) mod for Hollow Knight.

![image](https://user-images.githubusercontent.com/23219465/151241274-c8ffb2e2-8c20-43b2-af07-07272bc2972e.png)

## Special Thanks
[Jamie](https://github.com/ManicJamie) for the [room name dictionary](https://github.com/ManicJamie/HKTranslator/blob/master/TranslatorDictionary.xml)

[asimard](https://github.com/asimard1) for formatting the dictionary and room tagging

# Installation 
1) Go to [Releases](https://github.com/RanDumSocks/HKAutoTrackerElectron/releases) and download the latest `HKAT.zip`

2) Extract the contents of the zip file somewhere on your computer.

3) Double-click on `HKAT.exe`, done :)

Note: might be beneficial to create a shortcut to the executable and place it somewhere nice and neat. An installer might be a thing soon, so until then you can do it manually.

### Updating
As of now, you will just have to keep checking the [releases](https://github.com/RanDumSocks/HKAutoTrackerElectron/releases) page for new releases, and replace the old files witth the new ones. Consider watching this repo for notifications on when a new update comes out.

In the future, the application will auto-update, but I havent quite implemented that yet.

## Features
- Full dynamic room mapping as a flow chart
- Click, drag, and zoom controls 
- Seperate window workflow
- Display settings
	- Change layout of the map
	- Room name translation options
- Shows which rooms have reachable unchecked transitions and item checks
- Local map view (must have [HKMP](https://github.com/Extremelyd1/HKMP) installed)
	- Shows your current room, and immediate transitions, displaying what door leads to what adjacent room
- Nearest Locations Tracker (must have [HKMP](https://github.com/Extremelyd1/HKMP) installed)
	- Searches for the nearest unchecked transition and item check and displays the shortest path to get there
	- Shows closest bench to current location, good for telling your friends how to get to your location

## Usage
There are 3 windows in this program, the first window to load is the main window (HKAT), and that is the window where all the tracking computation is. Closing this window will close any other opened windows.

- Local Tracker
	- Shows the current room you are in, and immediate screen transitions discovered
- Nearest Tracker
	- Find the nearest unchecked screen transition, item check, and bench showing the exact shortest path to get there

### Colours
The map is colour coded, these are what the colours mean:
- Dark-green background
	- current location
- Light-blue background
	- Room with a bench
- Magenta background
	- Stag stations without a bench
- Green text
	- unchecked reachable item check with number of checks in brackets
- Orange boarder
	- unchecked reachable screen transition

## Feedback
If yyou find a bug, want a feature, or anything of that sort, [submit an issue](https://github.com/RanDumSocks/HKAutoTrackerElectron/issues/new) and I will respond swiftly.
