import { logger } from "@vendetta";
import { before } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";

const replacementRules: Array<{ pattern: RegExp; replacement: string }> = [
    {
        pattern: /(https?:\/\/)(?:[a-z0-9-]+\.)?(?:x\.com|twitter\.com)/gi,
        replacement: "$1fixupx.com",
    },
    {
        pattern: /(https?:\/\/)(?:[a-z0-9-]+\.)?tiktok\.com/gi,
        replacement: "$1tnktok.com",
    },
    {
        pattern: /(https?:\/\/)(?:[a-z0-9-]+\.)?instagram\.com/gi,
        replacement: "$1kkinstagram.com",
    },
    {
        pattern: /\b(?:[a-z0-9-]+\.)?(?:x\.com|twitter\.com)\b/gi,
        replacement: "fixupx.com",
    },
    {
        pattern: /\b(?:[a-z0-9-]+\.)?tiktok\.com\b/gi,
        replacement: "tnktok.com",
    },
    {
        pattern: /\b(?:[a-z0-9-]+\.)?instagram\.com\b/gi,
        replacement: "kkinstagram.com",
    },
];

function rewriteLinks(content: string): string {
    let next = content;
    for (const rule of replacementRules) {
        next = next.replace(rule.pattern, rule.replacement);
    }
    return next;
}

let cleanup: null | (() => void) = null;

export default {
    onLoad: () => {
        const patches: Array<() => void> = [];
        const MessageActions = findByProps("sendMessage", "editMessage");

        if (!MessageActions?.sendMessage) {
            logger.error("Fix Social Media Embeds: sendMessage not found.");
            cleanup = null;
            return;
        }

        patches.push(
            before("sendMessage", MessageActions, ([, message]) => {
                if (message?.content) {
                    message.content = rewriteLinks(message.content);
                }
            })
        );

        if (MessageActions?.editMessage) {
            patches.push(
                before("editMessage", MessageActions, ([, , message]) => {
                    if (message?.content) {
                        message.content = rewriteLinks(message.content);
                    }
                })
            );
        }

        cleanup = () => {
            for (const unpatch of patches) unpatch();
        };

        logger.log("Fix Social Media Embeds loaded.");
    },
    onUnload: () => {
        cleanup?.();
        cleanup = null;
        logger.log("Fix Social Media Embeds unloaded.");
    },
} as {
    onLoad: () => void;
    onUnload: () => void;
};
