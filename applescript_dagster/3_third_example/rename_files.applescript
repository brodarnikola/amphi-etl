on run {folderPath, oldPrefix, newPrefix}
    tell application "Finder"
        set targetFolder to POSIX file folderPath as alias
        set filesToRename to every file of targetFolder whose name starts with oldPrefix
        
        repeat with fileToRename in filesToRename
            set fileName to name of fileToRename
            set newName to text -5 thru -1 of fileName
            set name of fileToRename to newPrefix & newName
        end repeat
    end tell
end run