default: itr1-vortex itr2-vortex

MO2 ?= E:/Modding/MO2

itr1: itr1-vortex itr1-mo2
itr2: itr2-vortex itr2-mo2

itr1-vortex:
	-rm -f game-intotheradiusvr-vortex.zip
	sed -i "s/\.png/\.jpg/g" index.js
	sed -i "s/ITR2/ITR1/g" index.js
	sed -i "s/Into The Radius 2/Into The Radius/g" index.js
	sed -i "s/Into The Radius 2/Into The Radius/g" info.json
	sed -i "s/IntoTheRadius2/IntoTheRadius/g" index.js
	sed -i "s/intotheradius2/intotheradiusvr/g" index.js
	sed -i "s/2307350/1012790/g" index.js
	7z a game-intotheradiusvr-vortex.zip index.js info.json assets/

itr2-vortex:
	-rm -f game-intotheradius2-vortex.zip
	sed -i "s/\.jpg/\.png/g" index.js
	sed -i "s/ITR1/ITR2/g" index.js
	sed -i "s/Into The Radius/Into The Radius 2/g" index.js
	sed -i "s/Into The Radius/Into The Radius 2/g" info.json
	sed -i "s/IntoTheRadius/IntoTheRadius2/g" index.js
	sed -i "s/intotheradiusvr/intotheradius2/g" index.js
	sed -i "s/1012790/2307350/g" index.js
	sed -i "s/22//g" index.js
	sed -i "s/2 2//g" index.js
	sed -i "s/22//g" info.json
	sed -i "s/ 2 2/ 2/g" info.json
	7z a game-intotheradius2-vortex.zip index.js info.json assets/

mo2-install: itr1-mo2-install itr2-mo2-install
itr1-mo2-install: itr1-mo2
	cp ./intotheradius.py $(MO2)/plugins/basic_games/games/game_intotheradius.py
itr1-mo2:
	sed -i "s/\.png/\.jpg/g" intotheradius.py
	sed -i "s/ITR2/ITR1/g" intotheradius.py
	sed -i "s/Into The Radius 2/Into The Radius/g" intotheradius.py
	sed -i "s/IntoTheRadius2/IntoTheRadius/g" intotheradius.py
	sed -i "s/intotheradius2/intotheradiusvr/g" intotheradius.py
	sed -i "s/2307350/1012790/g" intotheradius.py

itr2-mo2-install: itr2-mo2
	cp ./intotheradius.py $(MO2)/plugins/basic_games/games/game_intotheradius2.py
itr2-mo2:
	sed -i "s/\.jpg/\.png/g" intotheradius.py
	sed -i "s/ITR1/ITR2/g" intotheradius.py
	sed -i "s/Into The Radius/Into The Radius 2/g" intotheradius.py
	sed -i "s/IntoTheRadius/IntoTheRadius2/g" intotheradius.py
	sed -i "s/intotheradiusvr/intotheradius2/g" intotheradius.py
	sed -i "s/1012790/2307350/g" intotheradius.py
	sed -i "s/22/2/g" intotheradius.py
mo2:
	$(MO2)/ModOrganizer.exe 
generate-dummy-installation:
	mkdir -p .dummy/IntoTheRadius .dummy-itr/IntoTheRadius/Content/Paks .dummy-itr/IntoTheRadius/Binaries/Win64 .dummy-itr/IntoTheRadius2/Content/Paks .dummy-itr/IntoTheRadius2/Binaries/Win64 
	touch .dummy-itr/IntoTheRadius.exe .dummy/IntoTheRadius2.exe

clean:
	-rm -f game-intotheradius2-vortex.zip
	-rm -f game-intotheradiusvr-vortex.zip

.PHONY: all clean
