These are the options that control how `ls` prints the listing:

- path: The directory to list. When the given path is a regular file, the tool lists that single file as one entry even when -R is given. Defaults to the current directory.
- showHidden: Whether to include hidden entries. Defaults to false.
- longFormat: Whether to print the long format, which shows the entry name only, not the path. Defaults to false.
- sortBy: How the entries are sorted. Either "name", "modified", or "none". sortBy "none" means entries are listed in filesystem order exactly as the operating system returns them, with no sorting applied. Defaults to "name".
- reverse: Whether to reverse the sort order, including both the name sort and the last-modified-time sort. Defaults to false.
- recursive: Whether to list subdirectories recursively. Recursive mode lists only the entries inside each directory; the directory itself is never listed. Defaults to false.
