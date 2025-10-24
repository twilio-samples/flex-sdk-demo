import React, { useState } from "react";
import { Box } from "@twilio-paste/core/box";
import { Modal, ModalBody, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading } from "@twilio-paste/core/modal";
import { Truncate } from "@twilio-paste/core/truncate";
import { useUID } from "@twilio-paste/core/uid-library";
import { Text } from "@twilio-paste/core/text";
import { Flex } from "@twilio-paste/core/flex";
import { Button } from "@twilio-paste/core/button";
import { ArrowBackIcon } from "@twilio-paste/icons/cjs/ArrowBackIcon";
import { Theme } from "@twilio-paste/theme";

type MediaPickerModalProps = {
    fileRef: React.MutableRefObject<HTMLInputElement | null>;
    onSendMedia: (file: File) => void;
};

export const createObjectURL = (file: File) => (window.URL || window.webkitURL).createObjectURL(file);

export function hasImageExtension(name: string) {
    const extensions = ["jpg", "jpeg", "gif", "png"];
    return extensions.includes(getImageExtension(name));
}
export const getImageExtension = (name?: string) => {
    const split = (name || "").split(".");
    const result = split[split.length - 1] || "";
    return result.toLowerCase();
};

export function MediaPickerModal({ fileRef, onSendMedia }: MediaPickerModalProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalHeadingID = useUID();
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState(0);
    const [imageObjectURL, setImageObjectURL] = useState<string | undefined>();

    const handleFileChange = () => {
        if (!fileRef.current || !fileRef.current.files?.length) {
            return;
        }
        const refName = fileRef.current.files[0].name;

        if (hasImageExtension(refName)) {
            setImageObjectURL(createObjectURL(fileRef.current.files[0]));
        }

        setIsModalOpen(true);
        setFileName(refName);
        setFileSize(fileRef.current.files[0].size);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setImageObjectURL(undefined);
        if (fileRef.current?.value) {
            fileRef.current.value = "";
        }
    };

    const handleChooseFile = () => {
        handleClose();
        fileRef.current?.click();
    };

    const handleSend = () => {
        if (fileRef.current) {
            const fileBlob = fileRef.current.files![0];

            onSendMedia(fileBlob);
            handleClose();
        }
    };

    return (
        <Theme.Provider theme="dark">
            <input type="file" onChange={handleFileChange} ref={fileRef} style={{ display: "none" }} />
            <Modal size="default" ariaLabelledby={modalHeadingID} isOpen={isModalOpen} onDismiss={handleClose}>
                <ModalHeader>
                    <ModalHeading as="h3" id={modalHeadingID}>
                        Send File
                    </ModalHeading>
                </ModalHeader>
                <ModalBody>
                    <Flex vertical hAlignContent="center">
                        {hasImageExtension(fileName) ? (
                            <Box>
                                {imageObjectURL && (
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <img
                                            style={{ maxWidth: "100%", maxHeight: "50vh" }}
                                            src={imageObjectURL}
                                            alt="Upload preview"
                                        />
                                        <Box paddingTop="space40">
                                            <Text as="span" color="colorTextWeak">
                                                {fileSize} Bytes, image
                                            </Text>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Box
                                minWidth={300}
                                maxWidth={500}
                                padding="space30"
                                borderWidth="borderWidth10"
                                borderStyle="solid"
                                borderColor="colorBorderWeak"
                                borderRadius="borderRadius20"
                            >
                                <Flex vAlignContent="center">
                                    <Box padding="space40"></Box>
                                    <Box marginLeft="space10" overflow="hidden">
                                        <Text fontWeight="fontWeightMedium" as="p">
                                            <Truncate title={fileName}>{fileName}</Truncate>
                                        </Text>
                                        <Text color="colorTextWeak" fontWeight="fontWeightMedium" as="p">
                                            {fileSize} bytes
                                        </Text>
                                    </Box>
                                </Flex>
                            </Box>
                        )}
                    </Flex>
                </ModalBody>
                <ModalFooter>
                    <ModalFooterActions justify="start">
                        <Button variant="secondary" onClick={handleChooseFile}>
                            <ArrowBackIcon decorative={false} title="Choose File" />
                            <Text as="span">Choose file</Text>
                        </Button>
                    </ModalFooterActions>
                    <ModalFooterActions>
                        <Button data-testid="send-file-button" onClick={handleSend} variant="primary">
                            Send
                        </Button>
                    </ModalFooterActions>
                </ModalFooter>
            </Modal>
        </Theme.Provider>
    );
}
