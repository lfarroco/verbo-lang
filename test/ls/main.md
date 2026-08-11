This defines the command-line interface for a tool called `ls` that lists the
contents of a directory. The user runs `ls` from a terminal, optionally passing
a directory path and some flags, and it prints one entry per line to standard
output.

Features:

- By default it lists the current directory.
- A positional argument selects the directory to list.
- `-a` includes hidden entries (names starting with a dot). With -a and -R combined, hidden directories are traversed recursively and printed with the same header format as any other directory.
- The long format prints the entry type as a single character ('d' for directory, 'f' for file), size in bytes, last-modified date and time in the form YYYY-MM-DD HH:MM in the local timezone, and the entry name.
- With `-t`, entries are sorted by last-modified time in descending order, most recently modified first; entries with equal timestamps are ordered by name in ascending order.
- `-r` reverses the sort order of the entries displayed within each directory, but it does not change the order in which subdirectories are traversed in recursive mode.
- `-R` lists subdirectories recursively. When a subdirectory cannot be read, the tool prints an error to standard error and continues with the other directories.
- The error message is printed to standard error and the tool exits with status code 1 for all error conditions.
