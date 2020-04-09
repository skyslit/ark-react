import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

type AlertPropType = {
    isOpen: boolean
    toggle: () => void
    title: string
    message: string
    canCloseManually: boolean
    mode: 'message' | 'wait' | 'error'
}

export function AlertModal(props: AlertPropType) {
    return (
        <Modal isOpen={props.isOpen} toggle={props.toggle} keyboard={false} backdrop={props.canCloseManually === false ? 'static' : undefined}>
            <ModalHeader className="text-muted" close={!props.canCloseManually ? <></> : undefined} toggle={props.toggle}>{props.mode === 'error' ? <i className="fas fa-exclamation-triangle mr-2 text-danger"></i> : props.mode === 'message' ? <i className="fas fa-info-circle mr-2 text-primary"></i> : null}{props.title}</ModalHeader>
            <ModalBody>
                {
                    props.mode === 'wait' ? <i className="fas fa-circle-notch fa-spin mr-2 text-muted"></i> : null
                }
                {props.message}
            </ModalBody>
            {
                props.canCloseManually === true ? (
                    <ModalFooter>
                        <Button color={props.mode === 'error' ? 'danger' : 'primary'} size="sm" onClick={props.toggle}>Close</Button>
                    </ModalFooter>
                ) : null
            }
        </Modal>
    )
}