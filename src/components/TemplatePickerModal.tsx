import { useState, useEffect, useRef } from "react";
import { Box } from "@twilio-paste/core/box";
import { Modal, ModalBody, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading } from "@twilio-paste/core/modal";
import { useUID } from "@twilio-paste/core/uid-library";
import { Text } from "@twilio-paste/core/text";
import { Button } from "@twilio-paste/core/button";
import { Input } from "@twilio-paste/core/input";
import { Label } from "@twilio-paste/core/label";
import { Spinner } from "@twilio-paste/core/spinner";
import { Badge } from "@twilio-paste/core/badge";
import { Theme } from "@twilio-paste/theme";
import { ArrowBackIcon } from "@twilio-paste/icons/cjs/ArrowBackIcon";
import {
    Client,
    Conversation,
    ContentTemplate,
    ContentTemplateVariable,
    GetContentTemplates
} from "@twilio/flex-sdk/actions/Conversation";

const SEARCH_DEBOUNCE_MS = 400;

function getTemplateBody(template: ContentTemplate): string | null {
    if (!template.types) return null;
    const types = template.types as Record<string, { body?: string }>;
    // Prefer the content type reported by approvalRequests; fall back to first entry
    const preferredKey = template.approvalRequests?.contentType;
    const entry = (preferredKey && types[preferredKey]) || Object.values(types)[0];
    return entry?.body ?? null;
}

function renderPreview(body: string, variableValues: Record<string, string>): string {
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => variableValues[key] || `{{${key}}}`);
}

export interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    conversation: Conversation | undefined;
}

export function TemplatePickerModal({ isOpen, onClose, client, conversation }: TemplatePickerModalProps) {
    const modalHeadingID = useUID();
    const [templates, setTemplates] = useState<ContentTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchTemplates = (contentName?: string) => {
        setLoading(true);
        setError(null);
        client
            .execute(new GetContentTemplates({ pageSize: 50, contentName, sortByContentName: "desc" }))
            .then((paginator) => setTemplates(paginator.items))
            .catch(() => setError("Failed to load templates."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!isOpen) return;
        setSelectedTemplate(null);
        setVariableValues({});
        setSearch("");
        fetchTemplates();
    }, [isOpen]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchTemplates(value || undefined);
        }, SEARCH_DEBOUNCE_MS);
    };

    const handleClose = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSelectedTemplate(null);
        setVariableValues({});
        onClose();
    };

    const handleSelectTemplate = (template: ContentTemplate) => {
        const vars = template.variables as Record<string, string> | null;
        const initialValues: Record<string, string> = {};
        if (vars) {
            Object.keys(vars).forEach((key) => {
                initialValues[key] = "";
            });
        }
        setSelectedTemplate(template);
        setVariableValues(initialValues);
    };

    const handleSend = async () => {
        if (!selectedTemplate?.sid || !conversation) return;

        const vars = selectedTemplate.variables as Record<string, string> | null;
        const contentVariables = vars
            ? Object.entries(variableValues).map(([name, value]) => new ContentTemplateVariable(name, value))
            : undefined;

        await conversation.conversation
            .prepareMessage()
            .setContentTemplate(selectedTemplate.sid, contentVariables)
            .build()
            .send();

        handleClose();
    };

    const templateVariables = selectedTemplate?.variables as Record<string, string> | null;
    const variableKeys = templateVariables ? Object.keys(templateVariables) : [];

    return (
        <Theme.Provider theme="dark">
            <Modal size="default" ariaLabelledby={modalHeadingID} isOpen={isOpen} onDismiss={handleClose}>
                <ModalHeader>
                    <ModalHeading as="h3" id={modalHeadingID}>
                        {selectedTemplate ? (selectedTemplate.friendlyName ?? "Template") : "Select a Template"}
                    </ModalHeading>
                </ModalHeader>
                <ModalBody>
                    {!selectedTemplate && (
                        <Box marginBottom="space40">
                            <Input
                                id="template-search"
                                name="template-search"
                                type="search"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </Box>
                    )}
                    {loading && (
                        <Box display="flex" justifyContent="center" padding="space60">
                            <Spinner decorative={false} title="Loading templates" />
                        </Box>
                    )}
                    {error && (
                        <Text as="p" color="colorTextError">
                            {error}
                        </Text>
                    )}
                    {!loading && !error && !selectedTemplate && (
                        <Box>
                            {templates.length === 0 && (
                                <Text as="p" color="colorTextWeak">
                                    No templates found.
                                </Text>
                            )}
                            {templates.map((template) => (
                                <Box
                                    key={template.sid}
                                    padding="space40"
                                    marginBottom="space30"
                                    borderWidth="borderWidth10"
                                    borderStyle="solid"
                                    borderColor="colorBorderWeak"
                                    borderRadius="borderRadius20"
                                    cursor="pointer"
                                    _hover={{ borderColor: "colorBorderPrimary" }}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Text as="p" fontWeight="fontWeightMedium">
                                            {template.friendlyName}
                                        </Text>
                                        {template.approvalRequests?.status && (
                                            <Badge
                                                as="span"
                                                variant={
                                                    template.approvalRequests.status === "approved"
                                                        ? "success"
                                                        : "neutral"
                                                }
                                            >
                                                {template.approvalRequests.status}
                                            </Badge>
                                        )}
                                    </Box>
                                    <Text as="p" color="colorTextWeak" fontSize="fontSize20">
                                        {template.language}
                                    </Text>
                                    {getTemplateBody(template) && (
                                        <Text as="p" fontSize="fontSize20" color="colorTextWeak" marginTop="space20">
                                            {getTemplateBody(template)}
                                        </Text>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                    {!loading && !error && selectedTemplate && (
                        <Box>
                            {variableKeys.length === 0 ? (
                                <Text as="p" color="colorTextWeak">
                                    This template has no variables.
                                </Text>
                            ) : (
                                variableKeys.map((key) => (
                                    <Box key={key} marginBottom="space40">
                                        <Label htmlFor={`var-${key}`}>{`{{${key}}}`}</Label>
                                        <Input
                                            id={`var-${key}`}
                                            name={`var-${key}`}
                                            type="text"
                                            placeholder={templateVariables?.[key] ?? key}
                                            value={variableValues[key] ?? ""}
                                            onChange={(e) =>
                                                setVariableValues((prev) => ({ ...prev, [key]: e.target.value }))
                                            }
                                        />
                                    </Box>
                                ))
                            )}
                            {getTemplateBody(selectedTemplate) && (
                                <Box
                                    marginTop="space50"
                                    padding="space40"
                                    backgroundColor="colorBackground"
                                    borderRadius="borderRadius20"
                                    borderWidth="borderWidth10"
                                    borderStyle="solid"
                                    borderColor="colorBorderWeak"
                                >
                                    <Text as="p" fontSize="fontSize20" color="colorTextWeak" marginBottom="space20">
                                        Preview
                                    </Text>
                                    <Text as="p" whiteSpace="pre-wrap">
                                        {renderPreview(getTemplateBody(selectedTemplate)!, variableValues)}
                                    </Text>
                                </Box>
                            )}
                        </Box>
                    )}
                </ModalBody>
                <ModalFooter>
                    {selectedTemplate && (
                        <ModalFooterActions justify="start">
                            <Button variant="secondary" onClick={() => setSelectedTemplate(null)}>
                                <ArrowBackIcon decorative={false} title="Back to templates" />
                                <Text as="span">Back</Text>
                            </Button>
                        </ModalFooterActions>
                    )}
                    <ModalFooterActions>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        {selectedTemplate && (
                            <Button variant="primary" onClick={handleSend}>
                                Send
                            </Button>
                        )}
                    </ModalFooterActions>
                </ModalFooter>
            </Modal>
        </Theme.Provider>
    );
}
