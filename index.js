const path = require('path');
const { fs, log, util, handlers } = require('vortex-api');

const GAME_DISPLAY_NAME = 'Into the Radius 2';
const GAME_INTERNAL_ID = 'IntoTheRadius2';
const GAME_FOLDER_NAME = 'IntoTheRadius2';
const GAME_EXECUTABLE = 'IntoTheRadius2.exe';
const GAME_STEAM_ID = '2307350';
const GAME_SHORT_NAME = 'ITR2';

// Derivable Constants
var GAME_NEXUS_ID = GAME_INTERNAL_ID.toLowerCase();

// Commonly used directories for mod files
var pakDir = path.join(GAME_FOLDER_NAME, 'Content', 'Paks');
var binDir = path.join(GAME_FOLDER_NAME, 'Binaries', 'Win64');
var modsDir = path.join(GAME_FOLDER_NAME, 'Mods');
const VALID_EXTENSIONS = ['.pak', '.utoc', '.ucas', '.uplugin', '.lua', '.ini', '.txt', '.dll'];

function findGame() {
	return util.GameStoreHelper.findByAppId(GAME_STEAM_ID)
		.then(game => game.gamePath);
}

function main(context) {
	context.registerGame({
		id: GAME_NEXUS_ID,
		name: GAME_DISPLAY_NAME,
		mergeMods: true,
		queryPath: findGame,
		supportedTools: [],
		queryModPath: () => './',
		logo: `assets/${GAME_SHORT_NAME}.jpg`,
		executable: () => GAME_EXECUTABLE,
		requiredFiles: [
			GAME_EXECUTABLE
		],
		setup: prepareForModding,
		environment: {
			SteamAPPId: GAME_STEAM_ID,
		},
		details: {
			steamAppId: GAME_STEAM_ID,
		},
	});
	context.registerInstaller(`${GAME_NEXUS_ID}-mod`, 25, testSupportedContent, installContent);
	return true;
}

/**
 * Utility function to copy a file from a source path to a destination path.
 * Needed because Vortex API lacks this functionality.
 */
async function copyFile(source, destination) {
	return new Promise((resolve, reject) => {
		const readStream = fs.createReadStream(source);
		const writeStream = fs.createWriteStream(destination);

		readStream.on('error', reject);
		writeStream.on('error', reject);
		writeStream.on('finish', resolve);

		readStream.pipe(writeStream);
	});
}

async function prepareForModding(discovery) {
	log('debug', "["+GAME_SHORT_NAME+" [SETUP] Preparing for modding");

	// Ensure writable directories exist for mods
	await Promise.all([
		fs.ensureDirWritableAsync(path.join(pakDir, "Mods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LogicMods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LuaMods")),
		fs.ensureDirWritableAsync(binDir),
		fs.ensureDirWritableAsync(modsDir),
	]);

	// Copy required files to the game's binaries directory
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'override.txt'), dest: path.join(discovery.path, binDir, 'override.txt') },
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
	log('debug', "["+GAME_SHORT_NAME+" [SETUP] Copied required files");
}

/**
 * Checks if the provided files include a FOMOD configuration.
 * @param {string[]} files - List of files in the mod package.
 * @returns {boolean} True if the mod contains a FOMOD.
 */
function isFomod(files) {
	if (files.some(f => path.basename(f) === 'moduleconfig.xml')) {
		log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Detected FOMOD");
		return true;
	}
	return false;
}

/**
 * Determines if the provided content is supported by this game extension.
 * Checks for specific file types and structures, such as .pak, .lua, or UE4SS mods.
 * @param {string[]} files - List of files in the mod package.
 * @param {string} gameId - The game ID to match against.
 * @returns {Promise<Object>} Supported status and required files.
 */
function testSupportedContent(files, gameId) {
	log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Testing supported content");

	// Skip unsupported games or FOMOD configurations
	if ((GAME_NEXUS_ID !== gameId) || isFomod(files)) {
		return Promise.resolve({
			supported: false,
			requiredFiles: [],
		});
	}

	let isLuaMod = false;

	// iterate over all folders at root to check if it's a Lua mod
	let hasMainlua = files.some(f => path.basename(f) === 'main.lua');
	let hasEnabledtxt = files.some(f => path.basename(f) === 'enabled.txt');
	let hasShared = files.some(f => path.basename(f) === 'shared');

	if ((hasMainlua && hasEnabledtxt) || hasShared) {
		isLuaMod = true;
	}


	// If a file ends with .pak, it's either a BP or pak mod.
	let isPakMod = files.some(f => path.extname(f).toLowerCase() === '.pak');
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss');
	let isCustomFormat = files.some(f => path.basename(f) === 'custom-full.txt') || files.some(f => path.basename(f) === 'custom.txt');
	let isSMLMod = files.some(f => path.extname(f).toLowerCase() === '.uplugin');

	// Log the detected type of supported content
	if (isUE4SS) log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Supported content [UE4SS]");
	if (isLuaMod) log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Supported content [LUA]");
	if (isPakMod) log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Supported content [PAK]");
	if (isCustomFormat) log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Supported content [CUSTOM]");
	if (isSMLMod) log('debug', "["+GAME_SHORT_NAME+" [SUPPORT] Supported content [SML]");

	return Promise.resolve({
		supported: isUE4SS || isLuaMod || isPakMod || isCustomFormat || isSMLMod,
		requiredFiles: [],
	});
}

/**
 * Installs the provided mod files into the appropriate directories.
 * Handles various mod types, such as Lua mods, PAK mods, and UE4SS mods.
 * @param {string[]} files - List of files in the mod package.
 * @returns {Promise<Object>} Installation instructions.
 */
function installContent(files) {
	let instructions = [];
	let alreadyCopied = [];
	log('debug', "["+GAME_SHORT_NAME+" [INSTALL] Files:", files);

	// Handle custom mod format
	const customFiles = files.filter(f => path.basename(f) === 'custom.txt');
	for (const customFile of customFiles) {
		const customDir = path.dirname(customFile);
		const customDirFiles = files.filter(f => path.dirname(f) === customDir);

		for (const file of customDirFiles) {
			if (!alreadyCopied.includes(file)) {
				if (path.basename(file) === 'custom.txt') {
					continue;
				}
				instructions.push({
					type: 'copy',
					source: file,
					destination: path.join(file),
				});
				alreadyCopied.push(file);
			}
		}
	}

	// Handle SimpleModLoader mods (.uplugin alongside .pak/.ucas/.utoc)
	const upluginFiles = files.filter(f => path.extname(f).toLowerCase() === '.uplugin');
	for (const upluginFile of upluginFiles) {
		const upluginDir = path.dirname(upluginFile);
		const modName = (upluginDir === '.' || upluginDir === '')
			? path.basename(upluginFile, '.uplugin')
			: path.basename(upluginDir);
		const contentDir = path.join(upluginDir, 'Content');
		const pakExts = ['.pak', '.ucas', '.utoc'];

		// Find pak/ucas/utoc files in the same dir as .uplugin or in its Content subdirectory
		const smlPakFiles = files.filter(f => {
			if (!pakExts.includes(path.extname(f).toLowerCase())) return false;
			if (upluginDir === '.' || upluginDir === '') return true;
			const dir = path.dirname(f);
			return dir === upluginDir || dir.startsWith(upluginDir + path.sep) || dir.startsWith(upluginDir + '/');
		});

		// Deploy the .uplugin file
		if (!alreadyCopied.includes(upluginFile)) {
			instructions.push({
				type: 'copy',
				source: upluginFile,
				destination: path.join(modsDir, modName, path.basename(upluginFile)),
			});
			alreadyCopied.push(upluginFile);
		}

		// Deploy pak/ucas/utoc files to Content subdirectory
		for (const smlFile of smlPakFiles) {
			if (!alreadyCopied.includes(smlFile)) {
				const relativePath = (upluginDir === '.' || upluginDir === '')
					? smlFile
					: path.relative(upluginDir, smlFile);

				instructions.push({
					type: 'copy',
					source: smlFile,
					destination: path.join(modsDir, modName, relativePath),
				});
				alreadyCopied.push(smlFile);
			}
		}
	}

	// Handle UE4SS mods
	if (files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss')) {
		log('debug', "["+GAME_SHORT_NAME+" [INSTALL] Copying UE4SS.dll, UE4SS-settings.ini, and Mods to root directory");

		const dwmapiFile = files.find(f => path.basename(f) === 'dwmapi.dll');
		if (dwmapiFile) {
			instructions.push({ type: 'copy', source: dwmapiFile, destination: path.join(binDir, 'dwmapi.dll') });
		}

		instructions.push(
			{ type: 'copy', source: files.find(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss'), destination: path.join(pakDir, 'UE4SS.dll') },
			{ type: 'copy', source: files.find(f => path.basename(f) === 'UE4SS-settings.ini' && path.dirname(f) === 'ue4ss'), destination: path.join(pakDir, 'UE4SS-settings.ini') }
		);

		// 'Mods' is a directory, not a file entry, so it can't be copied with a single
		// instruction. Copy every file under ue4ss/Mods individually instead.
		const modsPrefix = path.join('ue4ss', 'Mods') + path.sep;
		const ue4ssModsFiles = files.filter(f => f.startsWith(modsPrefix));
		for (const modFile of ue4ssModsFiles) {
			const relPath = modFile.slice(modsPrefix.length);
			instructions.push({
				type: 'copy',
				source: modFile,
				destination: path.join(pakDir, 'LuaMods', relPath),
			});
		}

		return Promise.resolve({ instructions });
	}

	let luaModDir = '';
	let luaSharedCopy = false;
	let luaModName = '';

	for (let f of files) {
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if (alreadyCopied.includes(f)) {
			log('debug', `[`+GAME_SHORT_NAME+` [INSTALL] Skipping already copied file: ${f}`);
			continue;
		}

		// Determine Lua Mod Name based on directory structure (if applicable)
		const fileDir = path.dirname(f);
		const baseDir = path.basename(fileDir);
		log('debug', `[`+GAME_SHORT_NAME+` [INSTALL] Base directory: ${baseDir}`);
		log('debug', `[`+GAME_SHORT_NAME+` [INSTALL] File directory: ${fileDir}`);

		// Check if the file is inside a LuaMods or related directory
		if (['luamods', 'luamod'].includes(baseDir.toLowerCase())) {
			luaModName = path.basename(path.dirname(fileDir));  // Mod name is the parent folder of LuaMods
		} else {
			luaModName = baseDir;  // Use the current folder as mod name if it's not under LuaMods
		}

		// Check for 'enabled.txt'
		if (path.basename(f) === 'enabled.txt') {
			luaModDir = fileDir;
			log('debug', `[`+GAME_SHORT_NAME+` [LUA] ${f} to ${path.join('LuaMods', luaModName, 'enabled.txt')}`);
			instructions.push(
				{
					type: 'copy',
					source: path.join(luaModDir, 'enabled.txt'),
					destination: path.join(pakDir, 'LuaMods', luaModName, 'enabled.txt'),
				},
				{
					type: 'copy',
					source: path.join(luaModDir, 'Scripts'),
					destination: path.join(pakDir, 'LuaMods', luaModName, 'Scripts'),
				}
			);
			continue;
		}

		if ((path.basename(fileDir) === 'shared') && (path.extname(f).toLowerCase() === '.lua') && !luaSharedCopy) {
			luaSharedCopy = true;

			if (luaModName === 'shared') {
				const parentFolder = path.basename(path.dirname(fileDir));
				luaModName = parentFolder === '' ? 'ITR2-Common' : parentFolder;
			}

			log('debug', `[`+GAME_SHORT_NAME+` [LUA] ${f} to ${path.join('LuaMods', 'shared', luaModName)}`);
			instructions.push({
				type: 'copy',
				source: path.dirname(f),
				destination: path.join(pakDir, 'LuaMods', 'shared', luaModName),
			});
			continue;
		}

		// Handle .pak, .ucas, .utoc files for LogicMods and Mods
		if (['.pak', '.ucas', '.utoc'].includes(path.extname(f).toLowerCase())) {
			let parentFolder = path.basename(path.dirname(f));
			let modName;

			if (parentFolder === 'LogicMods') {
				modName = path.basename(path.dirname(path.dirname(f)));
				log('debug', `[`+GAME_SHORT_NAME+` [BP] ${f} to ${path.join("LogicMods", modName, path.basename(f))}`);
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, "LogicMods", modName, path.basename(f)),
				});
			} else {
				modName = path.basename(path.dirname(f));
				log('debug', `[`+GAME_SHORT_NAME+` [PAK] ${f} to ${path.join("Mods", modName, path.basename(f))}`);
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, "Mods", modName, path.basename(f)),
				});
			}
		}
	}

	return Promise.resolve({ instructions });
}

module.exports = {
	default: main,
	installContent,
	testSupportedContent,
};
