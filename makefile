default: itr1 itr2

itr1:
	-rm -f game-intotheradiusvr.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius VR\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius VR';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadiusVR';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '1012790';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR1';/" index.js
	7z a game-intotheradiusvr.zip index.js info.json assets/

itr2:
	-rm -f game-intotheradius2.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius 2\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius 2';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadius2';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius2.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '2307350';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR2';/" index.js
	7z a game-intotheradius2.zip index.js info.json assets/

clean:
	-rm -f game-intotheradius2.zip
	-rm -f game-intotheradiusvr.zip

.PHONY: all clean
