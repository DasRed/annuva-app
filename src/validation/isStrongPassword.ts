/**
 * Password policy, shared by server and browser: at least 9 characters with upper-case and
 * lower-case letters and a digit. Special characters are allowed but not required.
 */
export default function isStrongPassword(password: string): boolean {
    return password.length >= 9
           && password.length <= 200
           && /\p{Lu}/u.test(password)
           && /\p{Ll}/u.test(password)
           && /\p{Nd}/u.test(password);
}
