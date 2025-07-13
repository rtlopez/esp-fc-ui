import { PropsWithChildren } from "react"
import { Col, Form, Row } from "react-bootstrap"

type FormItemProps = {
  label: string
  id: string
} & PropsWithChildren

const FormItem: React.FC<FormItemProps> = ({ label, id, children }) => {
  return <Form.Group as={Row} className="mb-3" controlId={id}>
    <Form.Label column>{label}</Form.Label>
    <Col sm={6}>
      {children}
    </Col>
  </Form.Group>
}

export default FormItem