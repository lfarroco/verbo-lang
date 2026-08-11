These are the properties for an entry in a directory listing:

- name: The name of the file or directory. Entries are sorted by name using case-sensitive ordering.
- path: The path of the entry relative to the listed directory, which is just the entry name in a plain listing and includes the subdirectory components (for example "subdir/file.txt") in recursive mode. The long format always displays the entry name only, never the path.
- isDirectory: Whether the entry is a directory (true) or a file (false). A symbolic link is listed as a file (isDirectory false) and is never followed.
- size: The size of the entry in bytes. A directory always reports size 0, never a computed total. For a symbolic link, the size of the link itself (not its target) is reported.
- modifiedAt: The date and time the entry was last modified, displayed in the local system timezone.
- hidden: Whether the entry is hidden (its name starts with a dot). The special entries '.' and '..' are never listed.

Relationships:

- A directory listing can contain multiple entries.
