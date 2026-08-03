import { Button, Text } from "@twilio-paste/core";

/** The dismiss button shared by the app's modals. */
export function ModalCancelButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="reset" onClick={onClick}>
            <Text as="span" color="colorText" fontWeight="fontWeightSemibold">
                Cancel
            </Text>
        </Button>
    );
}
